-- Expand-only rollout: apply before the application uses these RPCs. Old readers
-- and RPCs remain valid; application rollback leaves these functions/indexes intact.
create index if not exists idx_writings_published_order
  on public.writings (published_at desc nulls last, id desc) where status = 'published';
create index if not exists idx_writings_published_shelf_order
  on public.writings (shelf_id, published_at desc nulls last, id desc) where status = 'published';
create index if not exists idx_writings_status_updated_order
  on public.writings (status, updated_at desc, id desc);
create index if not exists idx_bookmarks_user_created_order
  on public.bookmarks (user_id, created_at desc, id desc);
-- Existing idx_writing_tags_tag_id already serves reverse tag lookup.

create or replace function public.get_shelf_counts()
returns table (shelf_id uuid, writing_count bigint)
language sql stable security invoker set search_path = ''
as $$
  select w.shelf_id, count(*) from public.writings w
  where w.status = 'published' group by w.shelf_id;
$$;

create or replace function public.get_archive_years()
returns table (year integer)
language sql stable security invoker set search_path = ''
as $$
  select distinct extract(year from w.published_at at time zone 'UTC')::integer as year
  from public.writings w where w.status = 'published' and w.published_at is not null
  order by year desc;
$$;

create or replace function public.get_daily_writing_id(day_number bigint)
returns uuid
language sql stable strict security invoker set search_path = ''
as $$
  select w.id from public.writings w where w.status = 'published'
  order by w.id
  limit 1 offset (
    select coalesce(((day_number % nullif(count(*), 0)) + count(*)) % nullif(count(*), 0), 0)
    from public.writings where status = 'published'
  );
$$;

-- Cross-reader bookmark totals need a definer; authorization is checked before
-- any query. No bookmarks, identities, or draft content leave this function.
create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'totalWritings', count(*),
      'totalViews', coalesce(sum(w.view_count), 0),
      'draftCount', count(*) filter (where w.status = 'draft'),
      'publishedCount', count(*) filter (where w.status = 'published'),
      'archivedCount', count(*) filter (where w.status = 'archived'),
      'scheduledCount', count(*) filter (where w.status = 'scheduled'),
      'mostViewed', coalesce((
        select jsonb_agg(jsonb_build_object('title', v.title, 'slug', v.slug, 'view_count', v.view_count)
          order by v.view_count desc, v.id)
        from (select id, title, slug, view_count from public.writings where status = 'published' order by view_count desc, id limit 5) v
      ), '[]'::jsonb),
      'mostBookmarked', coalesce((
        select jsonb_agg(jsonb_build_object('title', b.title, 'slug', b.slug, 'bookmark_count', b.bookmark_count)
          order by b.bookmark_count desc, b.id)
        from (
          select bw.id, bw.title, bw.slug, count(*) as bookmark_count
          from public.bookmarks bm join public.writings bw on bw.id = bm.writing_id
          group by bw.id order by bookmark_count desc, bw.id limit 5
        ) b
      ), '[]'::jsonb)
    ) from public.writings w
  );
end;
$$;

revoke all on function public.get_shelf_counts() from public;
revoke all on function public.get_archive_years() from public;
revoke all on function public.get_daily_writing_id(bigint) from public;
revoke all on function public.get_dashboard_stats() from public, anon;
grant execute on function public.get_shelf_counts() to anon, authenticated;
grant execute on function public.get_archive_years() to anon, authenticated;
grant execute on function public.get_daily_writing_id(bigint) to anon, authenticated;
grant execute on function public.get_dashboard_stats() to authenticated;
