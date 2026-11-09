-- "What's my table?" on the invitation page, on the day of the event.
-- A guest types the phone they registered with and gets their table name and
-- party size. No names are returned, so trying random numbers reveals nothing
-- about who is coming. The lookup only works on the event day (Israel time)
-- until 12 hours after the start, so early seating drafts never leak.

create or replace function private.seating_window_open(p_date_time timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select now() >= ((p_date_time at time zone 'Asia/Jerusalem')::date::timestamp at time zone 'Asia/Jerusalem')
     and now() <= p_date_time + interval '12 hours';
$$;

-- get_public_event gains seating_open, so it is recreated.
drop function public.get_public_event(text);

create function public.get_public_event(p_slug text)
returns table (
  slug text,
  title text,
  event_type public.event_type,
  description text,
  date_time timestamptz,
  venue_name text,
  address text,
  lat double precision,
  lng double precision,
  template_id text,
  media_url text,
  video_url text,
  primary_color text,
  gift_link_url text,
  rsvp_deadline timestamptz,
  registration_open boolean,
  is_full boolean,
  seating_open boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.slug, e.title, e.event_type, e.description, e.date_time,
    e.venue_name, e.address, e.lat, e.lng, e.template_id, e.media_url, e.video_url,
    e.primary_color, e.gift_link_url, e.rsvp_deadline,
    now() < coalesce(e.rsvp_deadline, e.date_time) as registration_open,
    e.max_guests is not null and coalesce((
      select sum(r.guest_count) from public.registrations r
      where r.event_id = e.id and r.status = 'confirmed'
    ), 0) >= e.max_guests as is_full,
    private.seating_window_open(e.date_time)
      and exists (select 1 from public.tables tb where tb.event_id = e.id) as seating_open,
    e.updated_at
  from public.events e
  where e.slug = p_slug and e.is_active;
$$;

revoke all on function public.get_public_event(text) from public;
grant execute on function public.get_public_event(text) to anon, authenticated;

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
  select * into v_event from public.events where slug = p_slug and is_active;
  if not found or not private.seating_window_open(v_event.date_time) then
    return query select 'closed'::text, null::text, null::integer;
    return;
  end if;

  select * into v_reg from public.registrations
  where event_id = v_event.id and phone = p_phone and status = 'confirmed';
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
