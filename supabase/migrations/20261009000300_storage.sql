-- Public media bucket for website imagery (tours, destinations, vehicles).
-- Uploads happen only through server code after staff authorization and
-- MIME/size validation, using the service role. Visitors can read objects
-- because the bucket is public; nobody else can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
