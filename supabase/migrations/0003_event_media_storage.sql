-- Stage 1: storage for invitation media (image or GIF, up to 10MB).
-- The bucket is public for reading, because the invitation page is public.
-- Only staff can upload, replace or delete files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "staff upload event media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-media' and (select private.is_staff()));

create policy "staff update event media" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-media' and (select private.is_staff()))
  with check (bucket_id = 'event-media' and (select private.is_staff()));

create policy "staff delete event media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-media' and (select private.is_staff()));
