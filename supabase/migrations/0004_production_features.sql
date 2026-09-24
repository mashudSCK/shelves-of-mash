-- Production media and scheduled-publishing support.

-- Harden security-definer helpers and prevent readers from changing roles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

revoke update on table public.profiles from authenticated;
grant update (display_name) on table public.profiles to authenticated;

create or replace function public.increment_writing_view(writing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.writings
  set view_count = view_count + 1
  where id = writing_id and status = 'published';

  if found then
    insert into public.views (writing_id, viewer_id)
    values (writing_id, auth.uid());
  end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'writing-covers',
  'writing-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "writing_covers_admin_insert" on storage.objects;
create policy "writing_covers_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'writing-covers' and public.is_admin());

drop policy if exists "writing_covers_admin_update" on storage.objects;
create policy "writing_covers_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'writing-covers' and public.is_admin())
with check (bucket_id = 'writing-covers' and public.is_admin());

drop policy if exists "writing_covers_admin_delete" on storage.objects;
create policy "writing_covers_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'writing-covers' and public.is_admin());

create index if not exists idx_writings_scheduled_for
  on public.writings (scheduled_for)
  where status = 'scheduled';
