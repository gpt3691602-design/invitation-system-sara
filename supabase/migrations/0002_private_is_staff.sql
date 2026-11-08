-- Move is_staff() out of the API-exposed public schema. RLS policies still
-- call it, but it is no longer reachable as /rest/v1/rpc/is_staff.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

drop policy "staff read staff" on public.staff;
drop policy "staff all events" on public.events;
drop policy "staff all registrations" on public.registrations;

create policy "staff read staff" on public.staff
  for select to authenticated using ((select private.is_staff()));

create policy "staff all events" on public.events
  for all to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

create policy "staff all registrations" on public.registrations
  for all to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

drop function public.is_staff();
