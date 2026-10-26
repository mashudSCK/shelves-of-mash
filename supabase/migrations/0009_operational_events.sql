-- Expand-only; application tolerates a missing table during rollout.
create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('error', 'slow_query', 'publishing')),
  name text not null check (length(name) <= 80),
  status text not null check (status in ('ok', 'error')),
  duration_ms integer check (duration_ms between 0 and 86400000),
  detail text check (length(detail) <= 80)
);
create index if not exists operational_events_recent on public.operational_events (created_at desc);
alter table public.operational_events enable row level security;
revoke all on public.operational_events from public, anon, authenticated;
grant select on public.operational_events to authenticated;
grant select, insert, delete on public.operational_events to service_role;
create policy "Administrators read operational events" on public.operational_events
  for select to authenticated using (public.is_admin());
