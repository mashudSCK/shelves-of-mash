-- Expand-only rollout: existing view RPCs and card readers remain compatible.
-- View counts are telemetry, not editorial changes. Ignore caller timestamp edits.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if row(new.title,new.subtitle,new.content,new.cover_image_url,new.shelf_id,
      new.status,new.published_at,new.scheduled_for,new.is_featured,new.slug,new.reading_time_minutes)
    is distinct from row(old.title,old.subtitle,old.content,old.cover_image_url,old.shelf_id,
      old.status,old.published_at,old.scheduled_for,old.is_featured,old.slug,old.reading_time_minutes) then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

create or replace function public.search_published_writings(
  query_text text, page_number integer default 1, page_size integer default 12
)
returns jsonb language sql stable security invoker set search_path = ''
as $$
  with parameters as (
    select websearch_to_tsquery('english',coalesce(query_text,'')) as query,
      least(greatest(coalesce(page_number,1),1),1000000) as page,
      least(greatest(coalesce(page_size,12),1),100) as size
  ), matches as materialized (
    select w.id, ts_rank_cd(w.search_vector,p.query) as rank, w.published_at
    from public.writings w cross join parameters p
    where w.status='published' and w.search_vector @@ p.query
  ), page as (
    select m.* from matches m
    order by m.rank desc,m.published_at desc nulls last,m.id desc
    limit (select size from parameters)
    offset (select (page-1)*size from parameters)
  )
  select jsonb_build_object(
    'total',(select count(*) from matches),
    'writings',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',w.id,'slug',w.slug,'title',w.title,'subtitle',w.subtitle,
        'cover_image_url',w.cover_image_url,'reading_time_minutes',w.reading_time_minutes,
        'published_at',w.published_at,'is_featured',w.is_featured,
        'shelf',jsonb_build_object('slug',s.slug,'name',s.name),
        'tags',coalesce((
          select jsonb_agg(jsonb_build_object('slug',t.slug,'name',t.name) order by t.slug)
          from public.writing_tags wt join public.tags t on t.id=wt.tag_id where wt.writing_id=w.id
        ),'[]'::jsonb),
        'excerpt',left(ts_headline('english',regexp_replace(w.content,'<[^>]*>',' ','g'),p.query,
          'StartSel="", StopSel="", MaxWords=48, MinWords=20, MaxFragments=1'),320)
      ) order by page.rank desc,page.published_at desc nulls last,page.id desc)
      from page join public.writings w on w.id=page.id
      join public.shelves s on s.id=w.shelf_id cross join parameters p
    ),'[]'::jsonb)
  );
$$;

revoke all on function public.search_published_writings(text,integer,integer) from public;
grant execute on function public.search_published_writings(text,integer,integer) to anon,authenticated;
-- Application rollback can retain this additive RPC. To restore historical timestamp
-- behavior, replace only set_updated_at() with the previous unconditional now() body.
