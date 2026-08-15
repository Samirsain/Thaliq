-- Storage buckets for menu item photos and restaurant branding.
--
-- Layout: every object is stored under the owning restaurant's id, e.g.
--   menu-images/<restaurant_id>/<uuid>.webp
--   restaurant-branding/<restaurant_id>/logo-<uuid>.webp
--
-- The first path segment is what the policies below check, so Restaurant A
-- can never overwrite or delete Restaurant B's images (PRD section 51's
-- isolation rule applies to files, not just rows).
--
-- Both buckets are public-read: customers scanning a QR code are anonymous
-- and must be able to load menu photos without a session. Nothing sensitive
-- goes in these buckets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'menu-images',
    'menu-images',
    true,
    2097152, -- 2 MB; the client compresses to well under this before upload
    array['image/webp', 'image/jpeg', 'image/png']
  ),
  (
    'restaurant-branding',
    'restaurant-branding',
    true,
    2097152,
    array['image/webp', 'image/jpeg', 'image/png']
  )
on conflict (id) do nothing;

-- Helper: is the caller an owner/manager of the restaurant whose id is the
-- first folder segment of this object's path?
--
-- The segment is regex-checked before casting: a path like "junk/x.webp"
-- would otherwise raise invalid_text_representation, and an exception inside
-- a policy fails the whole statement rather than simply denying the write.
create or replace function owns_storage_object_restaurant(object_name text)
returns boolean as $$
declare
  segment text := split_part(object_name, '/', 1);
begin
  if segment !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  return is_restaurant_manager(segment::uuid);
end;
$$ language plpgsql stable security definer set search_path = public;

-- Public read for both buckets.
create policy "menu_images_public_read" on storage.objects for select
  using (bucket_id in ('menu-images', 'restaurant-branding'));

-- Writes are restricted to the restaurant's own folder.
create policy "menu_images_manager_insert" on storage.objects for insert
  with check (
    bucket_id in ('menu-images', 'restaurant-branding')
    and owns_storage_object_restaurant(name)
  );

create policy "menu_images_manager_update" on storage.objects for update
  using (
    bucket_id in ('menu-images', 'restaurant-branding')
    and owns_storage_object_restaurant(name)
  );

create policy "menu_images_manager_delete" on storage.objects for delete
  using (
    bucket_id in ('menu-images', 'restaurant-branding')
    and owns_storage_object_restaurant(name)
  );
