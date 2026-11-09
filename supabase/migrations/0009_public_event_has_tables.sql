-- get_public_event gains has_tables (the invitation shows the "what's my table"
-- card at the bottom whenever the event has tables; it is interactive only
-- while seating_open), so it is recreated.
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
  has_tables boolean,
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
    exists (select 1 from public.tables tb where tb.event_id = e.id) as has_tables,
    e.updated_at
  from public.events e
  where e.slug = p_slug and e.is_active;
$$;

revoke all on function public.get_public_event(text) from public;
grant execute on function public.get_public_event(text) to anon, authenticated;

