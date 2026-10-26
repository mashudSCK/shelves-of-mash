import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const reader = '20000000-0000-4000-8000-000000000001';
const other = '20000000-0000-4000-8000-000000000003';
const admin = '20000000-0000-4000-8000-000000000002';
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
const asUser = async id => {
  await db.exec('reset role');
  await db.query("select set_config('test.reader',$1,false)", [id]);
  await db.exec(id ? 'set role authenticated' : 'set role anon');
};
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.reader',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;`);
  await db.exec(readFileSync('supabase/migrations/0001_initial_schema.sql','utf8').replace('create extension if not exists "pgcrypto";', ''));
  // Model Supabase's broad API grants before hardening; RLS still owns row access.
  await db.exec('grant all on all tables in schema public,storage to anon,authenticated,service_role');
  await db.exec(readFileSync('supabase/migrations/0004_production_features.sql','utf8'));
  for (const file of ['0006_unique_writing_views.sql','0007_scalable_reads.sql','0008_editorial_search.sql','0009_operational_events.sql']) {
    await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  }
  await db.exec(`insert into auth.users(id) values ('${reader}'),('${other}'),('${admin}');
    update public.profiles set role='admin' where id='${admin}';
    insert into public.shelves(id,slug,name) values(md5('s')::uuid,'essays','Essays');
    insert into public.writings(id,slug,title,content,shelf_id,status) values
      (md5('p')::uuid,'public','Public','Public body',md5('s')::uuid,'published'),
      (md5('d')::uuid,'private','Private','Private body',md5('s')::uuid,'draft');
    insert into public.bookmarks(user_id,writing_id) values('${reader}',md5('p')::uuid),('${other}',md5('p')::uuid);
    insert into public.operational_events(kind,name,status) values('publishing','publish_scheduled','ok');`);
  await asUser(reader);
  await assert.rejects(db.exec("update public.profiles set role='admin'"), /permission denied/);
  await db.exec(`update public.profiles set display_name='Reader name' where id='${reader}'`);
  assert.equal(await scalar('select public.is_admin()'), false);
  assert.equal(await scalar('select count(*)::int from public.profiles'), 1);
  assert.equal(await scalar("select count(*)::int from public.writings where status='draft'"), 0);
  assert.equal(await scalar('select count(*)::int from public.bookmarks'), 1);
  await assert.rejects(db.exec(`insert into public.bookmarks(user_id,writing_id) values('${other}',md5('d')::uuid)`), /row-level security/);
  await assert.rejects(db.exec("insert into public.shelves(slug,name) values('attack','Attack')"), /row-level security/);
  await assert.rejects(db.exec("insert into storage.objects(bucket_id,name) values('writing-covers','attack.png')"), /row-level security/);
  assert.equal(await scalar('select count(*)::int from public.operational_events'), 0);
  await assert.rejects(db.exec("insert into public.operational_events(kind,name,status) values('error','attack','error')"), /permission denied/);
  await asUser('');
  assert.equal(await scalar('select count(*)::int from public.writings'), 1);
  assert.equal(await scalar('select count(*)::int from public.bookmarks'), 0);
  await assert.rejects(db.exec('select * from public.operational_events'), /permission denied/);
  await asUser(admin);
  assert.equal(await scalar('select count(*)::int from public.writings'), 2);
  assert.equal(await scalar('select count(*)::int from public.operational_events'), 1);
  await db.exec("insert into storage.objects(bucket_id,name) values('writing-covers','valid.png')");
  await assert.rejects(db.exec("insert into storage.objects(bucket_id,name) values('other-bucket','invalid.png')"), /row-level security/);

  // An isolated archive-data recovery proof, not an auth/Storage disaster-recovery claim.
  await db.exec('reset role');
  const tables = ['shelves','tags','writings','writing_tags'];
  const snapshot = {};
  for (const table of tables) snapshot[table] = (await db.query(`select * from public.${table} order by 1`)).rows;
  const archive = JSON.parse(JSON.stringify(snapshot));
  const restored = new PGlite();
  try {
    await restored.exec("create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql as $$ select null::uuid $$");
    await restored.exec(readFileSync('supabase/migrations/0001_initial_schema.sql','utf8').replace('create extension if not exists "pgcrypto";', ''));
    for (const table of tables) {
      for (const row of archive[table]) {
        const keys = Object.keys(row).filter(key => key !== 'search_vector');
        await restored.query(`insert into public.${table} (${keys.join(',')}) values (${keys.map((_,i) => `$${i+1}`).join(',')})`, keys.map(key => row[key]));
      }
      const recovered = (await restored.query(`select * from public.${table} order by 1`)).rows;
      assert.deepEqual(JSON.parse(JSON.stringify(recovered)), archive[table], `Restore ${table} exactly in a separate database`);
    }
  } finally { await restored.close(); }
  console.log('PASS: profile role protection, private drafts/bookmarks, admin writes, Storage policies, private operations, isolated archive restore');
} finally { await db.close(); }
