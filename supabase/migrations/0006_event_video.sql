-- An optional video per event (for example a proposal or save-the-date clip).
-- The invitation page shows a player and a QR code that opens the video.

alter table public.events add column video_url text;

-- The media bucket now also takes short videos. 50MB is the per-file upload
-- limit on the Supabase free plan.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'event-media';

-- get_public_event returns a new column, so it must be recreated.
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
    e.updated_at
  from public.events e
  where e.slug = p_slug and e.is_active;
$$;

revoke all on function public.get_public_event(text) from public;
grant execute on function public.get_public_event(text) to anon, authenticated;
