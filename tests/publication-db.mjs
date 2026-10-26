// Run: node tests/publication-db.mjs <scratch @electric-sql/pglite/dist/index.js>
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
const admin = '20000000-0000-4000-8000-000000000002';
const search = async (q, page=1, size=12) => (await db.query('select public.search_published_writings($1,$2,$3)',[q,page,size])).rows[0].search_published_writings;
try {
  await db.exec(`create role anon; create role authenticated; create role untrusted; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.reader', true), '')::uuid $$;`);
  await db.exec(readFileSync('supabase/migrations/0001_initial_schema.sql','utf8').replace('create extension if not exists "pgcrypto";',''));
  const hardening=readFileSync('supabase/migrations/0004_production_features.sql','utf8');
  await db.exec(hardening.slice(0,hardening.indexOf('insert into storage.buckets')));
  for(const name of ['0006_unique_writing_views.sql','0007_scalable_reads.sql']) {
    // Resolve historical migration names without requiring a Supabase CLI or live database.
    const file=readdirSync('supabase/migrations').find(f=>f.startsWith(name.slice(0,4)));
    await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
  }
  await db.exec(`grant usage on schema public,auth to anon,authenticated,untrusted;
    grant select on public.writings,public.shelves,public.tags,public.writing_tags to anon,authenticated;
    insert into auth.users(id) values ('${admin}'); update public.profiles set role='admin' where id='${admin}';
    insert into public.shelves(id,slug,name) values (md5('shelf')::uuid,'essays','Essays');
    insert into public.tags(id,slug,name) values (md5('tag')::uuid,'life','Life');
    insert into public.writings(id,slug,title,content,shelf_id,status,published_at,updated_at)
      select md5(g::text)::uuid,'writing-'||g,case when g=1 then 'Running lighthouse' else 'Body match '||g end,
        '<script>alert(1)</script><p>Running lighthouse and quiet sea.</p> '||repeat('coast ',100),md5('shelf')::uuid,
        case when g=1206 then 'draft' else 'published' end,timestamptz '2000-01-01'+g*interval '1 day',timestamptz '1999-01-01'
      from generate_series(1,1206) g;
    insert into public.writing_tags values (md5('1')::uuid,md5('tag')::uuid);`);
  const migration='supabase/migrations/0008_editorial_search.sql';
  if(existsSync(migration)) await db.exec(readFileSync(migration,'utf8'));
  const original=await scalar("select updated_at from public.writings where slug='writing-1'");
  await db.exec(`set role anon; select public.increment_writing_view(md5('1')::uuid,md5('visitor')::uuid); reset role`);
  assert.equal((await scalar("select updated_at from public.writings where slug='writing-1'")).toISOString(),original.toISOString(),'Real view RPC must preserve editorial updated_at');
  assert.equal(await scalar("select view_count from public.writings where slug='writing-1'"),1);
  await db.exec("update public.writings set updated_at='2099-01-01' where slug='writing-1'");
  assert.equal((await scalar("select updated_at from public.writings where slug='writing-1'")).toISOString(),original.toISOString(),'Timestamp-only tampering must be ignored');
  await db.exec("update public.writings set content=content||' edited' where slug='writing-1'");
  assert.ok((await scalar("select updated_at from public.writings where slug='writing-1'"))>original,'Content edit must advance timestamp');
  for(const change of ["title=title||' change'", "subtitle='Subtitle'", "cover_image_url='/cover.png'",
    "shelf_id=md5('other-shelf')::uuid", "status='archived'", "published_at='2001-01-01'",
    "scheduled_for='2099-01-01'", "is_featured=true", "slug='changed-slug'", "reading_time_minutes=2"]) {
    if(change.startsWith('shelf_id')) await db.exec("insert into public.shelves(id,slug,name) values(md5('other-shelf')::uuid,'other','Other')");
    const before=await scalar("select updated_at from public.writings where slug='writing-2'");
    await db.query('select pg_sleep(0.005)');
    await db.exec(`update public.writings set ${change} where id=md5('2')::uuid`);
    assert.ok((await scalar("select updated_at from public.writings where id=md5('2')::uuid"))>before,change+' advances editorial timestamp');
    // Undo metadata on a separate row so ranked search fixtures remain unchanged.
    await db.exec("delete from public.writings where id=md5('2')::uuid; insert into public.writings(id,slug,title,content,shelf_id,status,published_at) values(md5('2')::uuid,'writing-2','Body match 2','Running lighthouse and quiet sea.',md5('shelf')::uuid,'published','2000-01-03')");
  }
  await db.exec('set role anon');
  const first=await search('running lighthouse');
  assert.equal(first.total,1205); assert.equal(first.writings.length,12);
  assert.equal(first.writings[0].slug,'writing-1','Older title match outranks newer body matches');
  assert.deepEqual(first.writings[0].shelf,{slug:'essays',name:'Essays'});
  assert.deepEqual(first.writings[0].tags,[{slug:'life',name:'Life'}]);
  assert.equal(first.writings[1].tags.length,0);
  assert.deepEqual(Object.keys(first.writings[0]).sort(),['id','slug','title','subtitle','cover_image_url','reading_time_minutes','published_at','is_featured','shelf','tags','excerpt'].sort());
  for(const card of first.writings) { assert.ok(card.excerpt.length<=320); assert.ok(!/<[^>]*>/.test(card.excerpt)); }
  const expectedIds=(await db.query("select id from public.writings where status='published' and search_vector @@ websearch_to_tsquery('english','running lighthouse') order by ts_rank_cd(search_vector,websearch_to_tsquery('english','running lighthouse')) desc,published_at desc nulls last,id desc limit 12 offset 12")).rows.map(row=>row.id);
  assert.deepEqual((await search('running lighthouse',2,12)).writings.map(row=>row.id),expectedIds,'Stable rank/date/id order and exact page boundary');
  const tail=await search('run',101,12); assert.equal(tail.total,1205); assert.equal(tail.writings.length,5);
  assert.equal((await search('"running lighthouse"')).total,1205);
  for(const q of ['',null,'   ','the','" : ! (']) assert.deepEqual(await search(q),{writings:[],total:0});
  assert.deepEqual(await search('missingword'),{writings:[],total:0});
  assert.equal((await search('run',-10,-2)).writings.length,1);
  assert.equal((await search('run',1,99999)).writings.length,100);
  assert.equal((await search('run',2147483647,100)).writings.length,0);
  assert.equal((await search('run',null,null)).writings.length,12);
  await assert.rejects(search('run','invalid',12),/integer/);
  await assert.rejects(search('run',2147483648,12),/range/);
  assert.equal(await scalar("select count(*)::int from public.writings where status='draft'"),0);
  await db.exec(`reset role; select set_config('test.reader','${admin}',false); set role authenticated`);
  assert.equal((await search('run')).total,1205,'Even admins search published content only');
  await db.exec('reset role; set role untrusted');
  await assert.rejects(search('run'),/permission denied/);
  await db.exec('reset role');
  assert.equal(await scalar("select prosecdef from pg_proc where oid='public.search_published_writings(text,integer,integer)'::regprocedure"),false);
  console.log('PASS: editorial timestamps, real view RPC, 1,205 ranked public results, exact paging/counts, safe bounded excerpts, query edge cases, invoker permissions and RLS');
} finally { await db.close(); }


