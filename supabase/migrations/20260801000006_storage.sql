-- Storage buckets replacing base44.integrations.Core.UploadFile.
-- Uploads happen via a signed upload URL minted by a Next.js Route Handler
-- (api/uploads/sign) after server-side authorization — see the plan doc.
-- Bucket-level policies below are a defense-in-depth fallback for any
-- direct-from-client usage of the anon/authenticated key.

insert into storage.buckets (id, name, public)
values
  ('listing-photos', 'listing-photos', true),
  ('avatars', 'avatars', true),
  ('tank-photos', 'tank-photos', true),
  ('service-photos', 'service-photos', true),
  ('help-thumbnails', 'help-thumbnails', true)
on conflict (id) do nothing;

-- Public read on all five buckets.
create policy storage_public_read on storage.objects for select
  using (bucket_id in ('listing-photos', 'avatars', 'tank-photos', 'service-photos', 'help-thumbnails'));

-- Authenticated users may write only under a path prefixed with their own uid,
-- e.g. listing-photos/{auth.uid()}/xyz.jpg — the upload-signing Route Handler
-- enforces this same convention when it builds the object path.
create policy storage_owner_write on storage.objects for insert
  with check (
    bucket_id in ('listing-photos', 'avatars', 'tank-photos', 'service-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_owner_update on storage.objects for update
  using (
    bucket_id in ('listing-photos', 'avatars', 'tank-photos', 'service-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_owner_delete on storage.objects for delete
  using (
    bucket_id in ('listing-photos', 'avatars', 'tank-photos', 'service-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- help-thumbnails is admin-managed content, not user-uploaded.
create policy storage_help_thumbnails_admin_write on storage.objects for insert
  with check (bucket_id = 'help-thumbnails' and is_admin());
create policy storage_help_thumbnails_admin_update on storage.objects for update
  using (bucket_id = 'help-thumbnails' and is_admin());
create policy storage_help_thumbnails_admin_delete on storage.objects for delete
  using (bucket_id = 'help-thumbnails' and is_admin());
