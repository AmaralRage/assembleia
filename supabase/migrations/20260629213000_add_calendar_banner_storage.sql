insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'calendar-banners',
  'calendar-banners',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Banners do calendario sao publicos" on storage.objects;
create policy "Banners do calendario sao publicos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'calendar-banners');

drop policy if exists "Somente admin envia banners do calendario" on storage.objects;
create policy "Somente admin envia banners do calendario"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'calendar-banners'
  and public.is_calendar_admin()
);

drop policy if exists "Somente admin atualiza banners do calendario" on storage.objects;
create policy "Somente admin atualiza banners do calendario"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'calendar-banners'
  and public.is_calendar_admin()
)
with check (
  bucket_id = 'calendar-banners'
  and public.is_calendar_admin()
);

drop policy if exists "Somente admin remove banners do calendario" on storage.objects;
create policy "Somente admin remove banners do calendario"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'calendar-banners'
  and public.is_calendar_admin()
);
