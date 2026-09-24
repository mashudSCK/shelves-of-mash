-- Make the auth signup trigger independent of the caller's search_path.
-- Without schema-qualified table names, Supabase Auth can fail signups with
-- "Database error saving new user" when the trigger cannot resolve profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data->>'name', 'reader')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
