-- Keep historical events/counts intact; remember known readers before switching writers.
create table public.writing_readers (
  writing_id uuid not null references public.writings(id) on delete cascade,
  reader_key text not null,
  primary key (writing_id, reader_key)
);
alter table public.writing_readers enable row level security;
revoke all on public.writing_readers from public, anon, authenticated;

insert into public.writing_readers (writing_id, reader_key)
select distinct writing_id, 'user:' || viewer_id::text
from public.views where viewer_id is not null
on conflict do nothing;

create function public.increment_writing_view(writing_id uuid, visitor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  reader text;
begin
  reader := case when auth.uid() is not null then 'user:' || auth.uid()::text
    when visitor_id is not null then 'browser:' || visitor_id::text end;
  if reader is null then return; end if;

  -- Serialize first visits for this writing, including concurrent tabs/requests.
  perform 1 from public.writings w
  where w.id = writing_id and w.status = 'published' for update;
  if not found then return; end if;

  insert into public.writing_readers (writing_id, reader_key)
  values (writing_id, reader) on conflict do nothing;
  if not found then return; end if;

  update public.writings w set view_count = w.view_count + 1 where w.id = writing_id;
  insert into public.views (writing_id, viewer_id) values (writing_id, auth.uid());
end;
$$;

-- Older deployments retain their RPC signature and gain account deduplication.
-- Anonymous requests without a browser identity intentionally do not count.
create or replace function public.increment_writing_view(writing_id uuid)
returns void language sql security definer set search_path = ''
as $$ select public.increment_writing_view(writing_id, null::uuid); $$;

revoke all on function public.increment_writing_view(uuid, uuid) from public;
revoke all on function public.increment_writing_view(uuid) from public;
grant execute on function public.increment_writing_view(uuid, uuid) to anon, authenticated;
grant execute on function public.increment_writing_view(uuid) to anon, authenticated;
