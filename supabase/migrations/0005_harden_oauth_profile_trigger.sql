-- Keep OAuth sign-ins from failing if profile creation hits an unexpected edge case.
-- Supabase Auth inserts auth.users before returning from OAuth; if this trigger
-- raises, Google login surfaces as a generic 500 unexpected_failure.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'preferred_username',
      split_part(coalesce(new.email, ''), '@', 1),
      'Reader'
    ),
    'reader'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'Could not create profile for auth user %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
