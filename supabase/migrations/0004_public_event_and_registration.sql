-- Stage 2: the public invitation page and guest self-registration.
-- Guests never get table access. They get exactly two functions:
--   get_public_event(slug)  -> the public fields of one active event
--   register_guest(...)     -> create or update their own registration
-- Both run as the function owner (security definer) and do every check
-- inside the database, so the app needs no secret key for the public flow.

-- ---------- read ----------
create or replace function public.get_public_event(p_slug text)
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
  primary_color text,
  gift_link_url text,
  rsvp_deadline timestamptz,
  registration_open boolean,
  is_full boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.slug, e.title, e.event_type, e.description, e.date_time,
    e.venue_name, e.address, e.lat, e.lng, e.template_id, e.media_url,
    e.primary_color, e.gift_link_url, e.rsvp_deadline,
    now() < coalesce(e.rsvp_deadline, e.date_time) as registration_open,
    e.max_guests is not null and coalesce((
      select sum(r.guest_count) from public.registrations r
      where r.event_id = e.id and r.status = 'confirmed'
    ), 0) >= e.max_guests as is_full,
    e.updated_at
  from public.events e
  where e.slug = p_slug and e.is_active;
$$;

revoke all on function public.get_public_event(text) from public;
grant execute on function public.get_public_event(text) to anon, authenticated;

-- ---------- write ----------
-- Returns one of: created | updated | not_found | closed | full | invalid.
-- Same phone for the same event updates the existing registration (work plan:
-- no duplicates). Capacity counts everyone else's confirmed guests, so a guest
-- can always lower their own count.
create or replace function public.register_guest(
  p_slug text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_guest_count integer,
  p_guest_names jsonb,
  p_notes text
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_taken integer;
  v_existing uuid;
begin
  -- Shape checks. The table constraints repeat most of them; checking here
  -- returns a clean status instead of an exception.
  if p_full_name is null or char_length(btrim(p_full_name)) not between 1 and 120
     or p_phone is null or p_phone !~ '^\+[1-9][0-9]{6,14}$'
     or (p_email is not null and (char_length(p_email) > 254 or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
     or p_guest_count is null or p_guest_count not between 1 and 50
     or p_guest_names is null or jsonb_typeof(p_guest_names) <> 'array'
     or jsonb_array_length(p_guest_names) > p_guest_count
     or exists (
       select 1 from jsonb_array_elements(p_guest_names) n
       where jsonb_typeof(n) <> 'string' or char_length(n #>> '{}') > 120
     )
     or (p_notes is not null and char_length(p_notes) > 1000)
  then
    return 'invalid';
  end if;

  -- Lock the event row so two last-seat registrations cannot both pass the
  -- capacity check.
  select * into v_event from public.events
  where slug = p_slug and is_active
  for update;
  if not found then
    return 'not_found';
  end if;

  if now() >= coalesce(v_event.rsvp_deadline, v_event.date_time) then
    return 'closed';
  end if;

  select id into v_existing from public.registrations
  where event_id = v_event.id and phone = p_phone;

  if v_event.max_guests is not null then
    select coalesce(sum(guest_count), 0) into v_taken
    from public.registrations
    where event_id = v_event.id and status = 'confirmed' and phone <> p_phone;
    if v_taken + p_guest_count > v_event.max_guests then
      return 'full';
    end if;
  end if;

  insert into public.registrations as r
    (event_id, full_name, phone, email, guest_count, guest_names, notes, status, source)
  values
    (v_event.id, btrim(p_full_name), p_phone, nullif(btrim(p_email), ''), p_guest_count,
     p_guest_names, nullif(btrim(p_notes), ''), 'confirmed', 'self')
  on conflict (event_id, phone) do update set
    full_name   = excluded.full_name,
    email       = excluded.email,
    guest_count = excluded.guest_count,
    guest_names = excluded.guest_names,
    notes       = excluded.notes,
    status      = 'confirmed';

  return case when v_existing is null then 'created' else 'updated' end;
exception
  when check_violation or string_data_right_truncation then
    return 'invalid';
end;
$$;

revoke all on function public.register_guest(text, text, text, text, integer, jsonb, text) from public;
grant execute on function public.register_guest(text, text, text, text, integer, jsonb, text) to anon, authenticated;
