// Run with: node tests/view-count.mjs <path to @electric-sql/pglite/dist/index.js>
// The PostgreSQL engine can be installed in scratch space; no app dependency is needed.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const writing = '10000000-0000-4000-8000-000000000001';
const reader = '20000000-0000-4000-8000-000000000001';
const browser = '30000000-0000-4000-8000-000000000001';
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql as
      $$ select nullif(current_setting('test.reader', true), '')::uuid $$;
    create table public.writings (id uuid primary key, status text, view_count integer default 0);
    create table public.views (writing_id uuid, viewer_id uuid);
    insert into public.writings values ('${writing}', 'published', 4);
    insert into public.views values ('${writing}', '${reader}');
  `);
  const previous = readFileSync('supabase/migrations/0004_production_features.sql', 'utf8');
  await db.exec(previous.slice(previous.indexOf('create or replace function public.increment_writing_view'), previous.indexOf('insert into storage.buckets')));
  const migration = 'supabase/migrations/0006_unique_writing_views.sql';
  if (existsSync(migration)) await db.exec(readFileSync(migration, 'utf8'));
  const count = async () => Number((await db.query('select view_count from public.writings')).rows[0].view_count);
  await db.exec(`select set_config('test.reader', '${reader}', false);
    select public.increment_writing_view('${writing}');
    select public.increment_writing_view('${writing}');`);
  assert.equal(await count(), 4, 'Historical reader reopening must not increase views');
  await db.exec(`select set_config('test.reader', '20000000-0000-4000-8000-000000000002', false);
    select public.increment_writing_view('${writing}');
    select public.increment_writing_view('${writing}');`);
  assert.equal(await count(), 5, 'New account counts once');
  await db.exec(`select set_config('test.reader', '', false);
    select public.increment_writing_view('${writing}', '${browser}');
    select public.increment_writing_view('${writing}', '${browser}');
    select public.increment_writing_view('${writing}');`);
  assert.equal(await count(), 6, 'Anonymous browser counts once; missing identity does not count');
  await db.exec(`select public.increment_writing_view('${writing}', '30000000-0000-4000-8000-000000000002');`);
  assert.equal(await count(), 7, 'Different browser counts separately');
  await db.exec(`update public.writings set status = 'draft';
    select public.increment_writing_view('${writing}', '30000000-0000-4000-8000-000000000003');`);
  assert.equal(await count(), 7, 'Drafts cannot gain views');
  const events = await db.query('select count(*)::int as count from public.views');
  assert.equal(events.rows[0].count, 4, 'Only first views add raw events; historical events remain');
  await db.exec('set role anon');
  await assert.rejects(db.query("insert into public.writing_readers values ('" + writing + "', 'fake')"), /permission denied/);
  console.log('PASS: historical readers, repeat accounts, browsers, missing identity, drafts, events, and permissions');
} finally {
  await db.close();
}
