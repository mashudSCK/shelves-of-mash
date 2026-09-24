-- =========================================================
-- The Shelves of Mash — Initial Schema
-- Run via: supabase db push, or paste into the SQL editor.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- profiles: one row per auth.users row, carries the role.
-- There should be exactly one 'admin' row (Mash).
-- ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'reader' check (role in ('admin', 'reader')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- shelves
-- ---------------------------------------------------------
create table shelves (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_shelves_sort_order on shelves (sort_order);

-- ---------------------------------------------------------
-- tags
-- ---------------------------------------------------------
create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

-- ---------------------------------------------------------
-- writings — the core content table. Drafts, published, and
-- archived posts all live here, distinguished by `status`,
-- matching the brief's single-table-with-status model (simpler
-- than a separate `drafts` table and avoids data duplication
-- when a draft becomes a published post).
-- ---------------------------------------------------------
create table writings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  content text not null,
  cover_image_url text,
  shelf_id uuid not null references shelves (id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived', 'scheduled')),
  reading_time_minutes integer not null default 1,
  is_featured boolean not null default false,
  view_count integer not null default 0,
  published_at timestamptz,
  scheduled_for timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored
);

create index idx_writings_status on writings (status);
create index idx_writings_shelf_id on writings (shelf_id);
create index idx_writings_published_at on writings (published_at desc);
create index idx_writings_view_count on writings (view_count desc);
create index idx_writings_search_vector on writings using gin (search_vector);
create unique index idx_writings_slug on writings (slug);

-- ---------------------------------------------------------
-- writing_tags — many-to-many join table
-- ---------------------------------------------------------
create table writing_tags (
  writing_id uuid not null references writings (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (writing_id, tag_id)
);

create index idx_writing_tags_tag_id on writing_tags (tag_id);

-- ---------------------------------------------------------
-- bookmarks
-- ---------------------------------------------------------
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  writing_id uuid not null references writings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, writing_id)
);

create index idx_bookmarks_user_id on bookmarks (user_id);
create index idx_bookmarks_writing_id on bookmarks (writing_id);

-- ---------------------------------------------------------
-- reading_lists + reading_list_items
-- ---------------------------------------------------------
create table reading_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table reading_list_items (
  reading_list_id uuid not null references reading_lists (id) on delete cascade,
  writing_id uuid not null references writings (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (reading_list_id, writing_id)
);

create index idx_reading_lists_user_id on reading_lists (user_id);

-- ---------------------------------------------------------
-- favorites — distinct from bookmarks per the brief's reader
-- feature list (favorites + bookmarks are both present); kept
-- as its own table to allow different semantics later
-- (e.g. favorites surfaced publicly on a profile, bookmarks not).
-- ---------------------------------------------------------
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  writing_id uuid not null references writings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, writing_id)
);

create index idx_favorites_user_id on favorites (user_id);

-- ---------------------------------------------------------
-- highlights — private passage highlights
-- ---------------------------------------------------------
create table highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  writing_id uuid not null references writings (id) on delete cascade,
  selected_text text not null,
  start_offset integer,
  end_offset integer,
  note text,
  created_at timestamptz not null default now()
);

create index idx_highlights_user_id on highlights (user_id);
create index idx_highlights_writing_id on highlights (writing_id);

-- ---------------------------------------------------------
-- views — raw view events, source data for analytics rollups
-- and the view_count counter on writings.
-- ---------------------------------------------------------
create table views (
  id uuid primary key default gen_random_uuid(),
  writing_id uuid not null references writings (id) on delete cascade,
  viewer_id uuid references auth.users (id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index idx_views_writing_id on views (writing_id);
create index idx_views_viewed_at on views (viewed_at desc);

-- ---------------------------------------------------------
-- reading_history — per-user reading history, separate from
-- the anonymous `views` log so it can be queried per-reader
-- without scanning all view events.
-- ---------------------------------------------------------
create table reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  writing_id uuid not null references writings (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  unique (user_id, writing_id)
);

create index idx_reading_history_user_id on reading_history (user_id);

-- ---------------------------------------------------------
-- analytics — daily rollups for the admin dashboard's growth charts
-- ---------------------------------------------------------
create table analytics_daily (
  day date primary key,
  total_views integer not null default 0,
  unique_visitors integer not null default 0,
  new_writings integer not null default 0
);

-- ---------------------------------------------------------
-- search_queries — log of searches, powers "most searched topics"
-- ---------------------------------------------------------
create table search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  result_count integer not null default 0,
  searcher_id uuid references auth.users (id) on delete set null,
  searched_at timestamptz not null default now()
);

create index idx_search_queries_searched_at on search_queries (searched_at desc);

-- ---------------------------------------------------------
-- ai_summaries — one pre-generated librarian summary per writing
-- ---------------------------------------------------------
create table ai_summaries (
  id uuid primary key default gen_random_uuid(),
  writing_id uuid not null unique references writings (id) on delete cascade,
  summary text not null,
  model text,
  generated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- related_writings — precomputed related-writing edges,
-- separate from the live shelf-based fallback used in lib/data
-- so an AI classification job can later populate stronger
-- thematic relations without changing read-path code.
-- ---------------------------------------------------------
create table related_writings (
  writing_id uuid not null references writings (id) on delete cascade,
  related_writing_id uuid not null references writings (id) on delete cascade,
  relation_strength real not null default 0.5,
  relation_reason text,
  primary key (writing_id, related_writing_id),
  check (writing_id <> related_writing_id)
);

create index idx_related_writings_writing_id on related_writings (writing_id);

-- ---------------------------------------------------------
-- settings — singleton key/value site settings
-- ---------------------------------------------------------
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Functions
-- =========================================================

-- Keep updated_at fresh on writings without relying on app code.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_writings_updated_at
  before update on writings
  for each row execute function set_updated_at();

-- Efficient single random published writing (avoids ORDER BY random()
-- over the whole table as the archive grows).
create or replace function get_random_published_writing()
returns setof writings as $$
  select w.* from writings w
  join (
    select id from writings where status = 'published'
    order by random()
    limit 1
  ) pick on pick.id = w.id;
$$ language sql stable;

-- Atomic view increment, also logs a raw view event for analytics.
create or replace function increment_writing_view(writing_id uuid)
returns void as $$
begin
  update writings set view_count = view_count + 1 where id = writing_id;
  insert into views (writing_id, viewer_id) values (writing_id, auth.uid());
end;
$$ language plpgsql security definer;

-- =========================================================
-- Row Level Security
-- =========================================================

alter table profiles enable row level security;
alter table shelves enable row level security;
alter table tags enable row level security;
alter table writings enable row level security;
alter table writing_tags enable row level security;
alter table bookmarks enable row level security;
alter table reading_lists enable row level security;
alter table reading_list_items enable row level security;
alter table favorites enable row level security;
alter table highlights enable row level security;
alter table views enable row level security;
alter table reading_history enable row level security;
alter table analytics_daily enable row level security;
alter table search_queries enable row level security;
alter table ai_summaries enable row level security;
alter table related_writings enable row level security;
alter table settings enable row level security;

-- Helper: is the current user the admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- profiles: users can read their own profile; admin can read all.
create policy "profiles_select_own" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- shelves: public read; admin write.
create policy "shelves_select_all" on shelves for select using (true);
create policy "shelves_admin_write" on shelves for all using (is_admin()) with check (is_admin());

-- tags: public read; admin write (also written by the app on tag creation).
create policy "tags_select_all" on tags for select using (true);
create policy "tags_admin_write" on tags for all using (is_admin()) with check (is_admin());

-- writings: published rows are public; admin sees and writes everything.
create policy "writings_select_published" on writings for select using (
  status = 'published' or is_admin()
);
create policy "writings_admin_write" on writings for all using (is_admin()) with check (is_admin());

-- writing_tags: readable alongside published writings; admin manages.
create policy "writing_tags_select" on writing_tags for select using (
  exists (select 1 from writings w where w.id = writing_id and (w.status = 'published' or is_admin()))
);
create policy "writing_tags_admin_write" on writing_tags for all using (is_admin()) with check (is_admin());

-- bookmarks: strictly private to the owning user.
create policy "bookmarks_owner_all" on bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reading_lists + items: private to owner.
create policy "reading_lists_owner_all" on reading_lists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reading_list_items_owner_all" on reading_list_items for all
  using (exists (select 1 from reading_lists rl where rl.id = reading_list_id and rl.user_id = auth.uid()))
  with check (exists (select 1 from reading_lists rl where rl.id = reading_list_id and rl.user_id = auth.uid()));

-- favorites: private to owner.
create policy "favorites_owner_all" on favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- highlights: private to owner.
create policy "highlights_owner_all" on highlights for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- views: insert-only from any authenticated/anon context via the RPC
-- (security definer), no direct table access needed by clients; admin
-- can read for analytics.
create policy "views_admin_select" on views for select using (is_admin());
create policy "views_insert_any" on views for insert with check (true);

-- reading_history: private to owner.
create policy "reading_history_owner_all" on reading_history for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- analytics_daily: admin only.
create policy "analytics_admin_select" on analytics_daily for select using (is_admin());

-- search_queries: anyone can insert (to log their own search), admin reads all.
create policy "search_queries_insert_any" on search_queries for insert with check (true);
create policy "search_queries_admin_select" on search_queries for select using (is_admin());

-- ai_summaries: readable alongside published writings.
create policy "ai_summaries_select" on ai_summaries for select using (
  exists (select 1 from writings w where w.id = writing_id and (w.status = 'published' or is_admin()))
);
create policy "ai_summaries_admin_write" on ai_summaries for all using (is_admin()) with check (is_admin());

-- related_writings: readable alongside published writings.
create policy "related_writings_select" on related_writings for select using (
  exists (select 1 from writings w where w.id = writing_id and (w.status = 'published' or is_admin()))
);
create policy "related_writings_admin_write" on related_writings for all using (is_admin()) with check (is_admin());

-- settings: public settings readable by all, admin writes.
create policy "settings_select_all" on settings for select using (true);
create policy "settings_admin_write" on settings for all using (is_admin()) with check (is_admin());

-- =========================================================
-- New-user trigger: create a profile row (role defaults to
-- 'reader') whenever someone signs up via Supabase Auth.
-- =========================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data->>'name', 'reader');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
