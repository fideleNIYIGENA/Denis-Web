-- ============================================================
--  Denis Ndayishimiye — Supabase Storage Buckets
--  Run this in: Supabase Dashboard → SQL Editor → New query
--  (after schema.sql)
-- ============================================================
--  Creates the five buckets used by the app and marks them PUBLIC
--  so uploaded files are served directly from Supabase's CDN.
--  Uploads/deletes are performed server-side with the service role,
--  so no per-object policies are required.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio', 'audio', true, 26214400, array['audio/mpeg','audio/mp3','audio/wav','audio/x-m4a']),
  ('covers', 'covers', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif']),
  ('gallery', 'gallery', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif']),
  ('event-posters', 'event-posters', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif']),
  ('news-images', 'news-images', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif']),
  ('profile', 'profile', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif','text/plain'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read access for everyone (public buckets already allow it,
-- this is a safety net if the bucket was created with public = false).
drop policy if exists "Public read access" on storage.objects;
create policy "Public read access"
  on storage.objects for select
  using (bucket_id in ('audio','covers','gallery','event-posters','news-images','profile'));
