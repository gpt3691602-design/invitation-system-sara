-- Fix: qualify columns in find_my_table ("status" was ambiguous with the
-- function's own output column). Same body as 0007, now qualified.
-- status: found | not_seated | not_found | closed
create or replace function public.find_my_table(p_slug text, p_phone text)
returns table (status text, table_name text, guest_count integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_reg public.registrations%rowtype;
  v_table text;
begin
  -- Every column is qualified: the output columns (status, table_name,
  -- guest_count) are also PL/pgSQL variables and would be ambiguous.
  select e.* into v_event from public.events e where e.slug = p_slug and e.is_active;
  if not found or not private.seating_window_open(v_event.date_time) then
    return query select 'closed'::text, null::text, null::integer;
    return;
  end if;

  select r.* into v_reg from public.registrations r
  where r.event_id = v_event.id and r.phone = p_phone and r.status = 'confirmed';
  if not found then
    return query select 'not_found'::text, null::text, null::integer;
    return;
  end if;

  select tb.name into v_table
  from public.registration_tables rt
  join public.tables tb on tb.id = rt.table_id
  where rt.registration_id = v_reg.id;

  if v_table is null then
    return query select 'not_seated'::text, null::text, v_reg.guest_count;
  else
    return query select 'found'::text, v_table, v_reg.guest_count;
  end if;
end;
$$;

revoke all on function public.find_my_table(text, text) from public;
grant execute on function public.find_my_table(text, text) to anon, authenticated;
