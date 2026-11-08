-- Stage 6: table seating.
-- tables: the tables of one event, with a seat capacity.
-- registration_tables: which table a registration (a whole party) sits at.
-- A registration sits at one table at most (primary key), and the composite
-- foreign keys make it impossible to seat a guest at another event's table.

create table public.tables (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  capacity   integer not null default 10 check (capacity between 1 and 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, event_id)
);

create index tables_event_idx on public.tables (event_id, sort_order);

-- Needed as the target of the composite foreign key below.
alter table public.registrations add constraint registrations_id_event_key unique (id, event_id);

create table public.registration_tables (
  registration_id uuid primary key,
  table_id        uuid not null,
  event_id        uuid not null,
  foreign key (registration_id, event_id) references public.registrations(id, event_id) on delete cascade,
  foreign key (table_id, event_id) references public.tables(id, event_id) on delete cascade
);

create index registration_tables_table_idx on public.registration_tables (table_id, event_id);
create index registration_tables_event_idx on public.registration_tables (event_id);

alter table public.tables enable row level security;
alter table public.registration_tables enable row level security;

create policy "staff all tables" on public.tables
  for all to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

create policy "staff all registration_tables" on public.registration_tables
  for all to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));
