// Run: node tests/scalability-db.mjs <scratch @electric-sql/pglite/dist/index.js>
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const reader = '20000000-0000-4000-8000-000000000001';
const admin = '20000000-0000-4000-8000-000000000002';
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.reader', true), '')::uuid $$;`);
  await db.exec(readFileSync('supabase/migrations/0001_initial_schema.sql', 'utf8').replace('create extension if not exists "pgcrypto";', ''));
  const hardening = readFileSync('supabase/migrations/0004_production_features.sql', 'utf8');
  await db.exec(hardening.slice(0, hardening.indexOf('insert into storage.buckets')));
  await db.exec(`grant usage on schema public, auth to anon, authenticated;
    grant select on public.writings, public.bookmarks to anon, authenticated;
    insert into auth.users(id) values ('${reader}'), ('${admin}');
    update public.profiles set role='admin' where id='${admin}';
    insert into public.shelves(id,slug,name) select md5('shelf'||g)::uuid, 'shelf-'||g,'Shelf '||g from generate_series(1,10) g;
    insert into public.writings(id,slug,title,content,shelf_id,status,published_at,updated_at,view_count)
      select md5(g::text)::uuid,'writing-'||g,'Writing '||g,'Body',md5('shelf'||(1+g%10))::uuid,
        case when g<=15000 then 'published' when g<=17000 then 'draft' when g<=19000 then 'archived' else 'scheduled' end,
        case when g<=15000 then timestamptz '2000-01-01 00:00:00+00' + (g%9000)*interval '1 day' else timestamptz '2099-01-01' end,
        timestamptz '2020-01-01' + g*interval '1 hour', g%101 from generate_series(1,20000) g;
    insert into public.bookmarks(id,user_id,writing_id,created_at)
      select md5('bookmark'||g)::uuid,case when g%2=0 then '${reader}'::uuid else '${admin}'::uuid end,
      md5(g::text)::uuid,timestamptz '2020-01-01'+g*interval '1 minute' from generate_series(1,20000) g;`);
  const migration = 'supabase/migrations/0007_scalable_reads.sql';
  if (existsSync(migration)) await db.exec(readFileSync(migration, 'utf8'));
  await db.exec('set role anon');
  assert.equal(Number(await scalar('select sum(writing_count) from public.get_shelf_counts()')), 15000);
  assert.equal((await db.query('select * from public.get_archive_years()')).rows.length, 25);
  const expected = await scalar("select id from public.writings where status='published' order by id offset 14000 limit 1");
  assert.equal(await scalar('select public.get_daily_writing_id(14000)'), expected);
  assert.equal(await scalar('select public.get_daily_writing_id(29000)'), expected);
  assert.equal(await scalar('select public.get_daily_writing_id(-1000)'), expected);
  assert.equal(await scalar('select public.get_daily_writing_id(null)'), null);
  await assert.rejects(db.query('select public.get_dashboard_stats()'), /permission denied/);
  assert.equal(Number(await scalar("select count(*) from public.writings where status <> 'published'")),0);
  assert.equal(Number(await scalar('select count(*) from public.bookmarks')),0);
  await db.exec(`reset role; select set_config('test.reader','${reader}',false); set role authenticated`);
  await assert.rejects(db.query('select public.get_dashboard_stats()'), /administrator/i);
  assert.equal(Number(await scalar('select count(*) from public.bookmarks')),10000);
  await db.exec(`reset role; select set_config('test.reader','${admin}',false); set role authenticated`);
  // Even administrators receive published-only public aggregates.
  assert.equal(Number(await scalar('select sum(writing_count) from public.get_shelf_counts()')),15000);
  const stats = await scalar('select public.get_dashboard_stats()');
  assert.deepEqual([stats.totalWritings,stats.draftCount,stats.publishedCount,stats.archivedCount,stats.scheduledCount], [20000,2000,15000,2000,1000]);
  assert.equal(stats.totalViews, Number(await scalar('select sum(view_count) from public.writings')));
  assert.equal(stats.mostViewed.length,5); assert.equal(stats.mostBookmarked.length,5);
  assert.deepEqual(stats.mostViewed, (await db.query("select title,slug,view_count from public.writings where status='published' order by view_count desc,id limit 5")).rows);
  await db.exec('reset role');
  assert.deepEqual(stats.mostBookmarked, (await db.query('select w.title,w.slug,count(*)::int bookmark_count from public.bookmarks b join public.writings w on w.id=b.writing_id group by w.id order by count(*) desc,w.id limit 5')).rows);
  await db.exec('reset role; analyze public.writings; analyze public.bookmarks');
  const plans = [
    ['idx_writings_published_order', "select id from public.writings where status='published' order by published_at desc nulls last,id desc limit 12"],
    ['idx_writings_published_shelf_order', "select id from public.writings where status='published' and shelf_id=md5('shelf1')::uuid order by published_at desc nulls last,id desc limit 12"],
    ['idx_writings_status_updated_order', "select id from public.writings where status='draft' order by updated_at desc,id desc limit 20"],
    ['idx_bookmarks_user_created_order', `select id from public.bookmarks where user_id='${reader}' order by created_at desc,id desc limit 20`],
  ];
  for (const [index, sql] of plans) {
    const plan = (await db.query('explain (analyze, buffers) '+sql)).rows.map(row => row['QUERY PLAN']).join('\n');
    assert.ok(plan.includes(index), `Expected planner use of ${index}: ${plan}`);
    console.log(plan);
  }
  for (const fn of ['get_shelf_counts()', 'get_archive_years()', 'get_daily_writing_id(14000)', 'get_dashboard_stats()']) {
    const start=performance.now(); for(let i=0;i<10;i++) await db.query('select public.'+fn);
    console.log(`${fn}: ${((performance.now()-start)/10).toFixed(2)} ms mean (10 warm calls)`);
  }
  await db.exec("delete from public.bookmarks; delete from public.writings");
  assert.equal(await scalar('select public.get_daily_writing_id(1)'),null);
  const empty=await scalar('select public.get_dashboard_stats()');
  assert.equal(empty.totalWritings,0); assert.equal(empty.totalViews,0); assert.deepEqual(empty.mostViewed,[]); assert.deepEqual(empty.mostBookmarked,[]);
  console.log('PASS: 20,000 writings, complete aggregates, deterministic full-set daily selection, admin guard, RLS, empty states, and index plans');
} finally { await db.close(); }
