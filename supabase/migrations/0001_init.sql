-- Stage 0: core schema for events and registrations, with RLS.
-- Access model (work plan): one business, several staff members, every staff
-- member sees everything. Guests never get a database account; the public
-- registration flow runs on the server (stage 2).

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- staff ----------
-- Supabase Auth allows sign-ups by default. Without this allow-list, anyone who
-- creates an account would pass an "authenticated" RLS check and read every
-- guest's phone number. A user counts as staff only when listed here.
create table public.staff (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

create or replace function public.is_staff()
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

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- Adds an existing Auth user to the staff list. Run from the SQL Editor:
--   select public.add_staff('person@example.com', 'Display name');
create or replace function public.add_staff(p_email text, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email);
  if v_user_id is null then
    raise exception 'No auth user with email %', p_email;
  end if;
  insert into public.staff (user_id, display_name)
  values (v_user_id, p_display_name)
  on conflict (user_id) do update set display_name = excluded.display_name;
  return v_user_id;
end;
$$;

revoke all on function public.add_staff(text, text) from public, anon, authenticated;

-- ---------- events ----------
create type public.event_type as enum ('private', 'business');

create table public.events (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title                  text not null check (char_length(title) between 1 and 200),
  event_type             public.event_type not null default 'private',
  description            text,
  date_time              timestamptz not null,
  venue_name             text,
  address                text,
  lat                    double precision check (lat is null or lat between -90 and 90),
  lng                    double precision check (lng is null or lng between -180 and 180),
  template_id            text not null default 'classic',
  media_url              text,
  primary_color          text check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$'),
  gift_link_url          text,
  reminder_offset_hours  integer not null default 24 check (reminder_offset_hours >= 0),
  reminder_sent_at       timestamptz,
  rsvp_deadline          timestamptz,
  max_guests             integer check (max_guests is null or max_guests > 0),
  created_by             uuid references auth.users(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  is_active              boolean not null default true
);

create index events_date_time_idx on public.events (date_time);
create index events_created_by_idx on public.events (created_by);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------- registrations ----------
create type public.registration_status as enum ('confirmed', 'cancelled');
create type public.registration_source as enum ('self', 'manual');

create table public.registrations (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  full_name    text not null check (char_length(full_name) between 1 and 120),
  -- Stored in international format (E.164, e.g. +972501234567) so wa.me links work.
  phone        text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  email        text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guest_count  integer not null default 1 check (guest_count between 1 and 50),
  guest_names  jsonb not null default '[]'::jsonb check (jsonb_typeof(guest_names) = 'array'),
  notes        text check (notes is null or char_length(notes) <= 1000),
  status       public.registration_status not null default 'confirmed',
  source       public.registration_source not null default 'self',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Duplicate guard: registering again with the same phone updates the row.
  unique (event_id, phone)
);

create trigger registrations_set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.staff         enable row level security;
alter table public.events        enable row level security;
alter table public.registrations enable row level security;

-- No policy for anon on any table: guests read the public page and register
-- through server code only.

create policy "staff read staff" on public.staff
  for select to authenticated using ((select public.is_staff()));

create policy "staff all events" on public.events
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "staff all registrations" on public.registrations
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));
