
-- Replace the broad public SELECT with a narrower one: anon cannot list,
-- public files remain accessible by their direct public URL because the
-- bucket itself is marked public.
DROP POLICY IF EXISTS "Public read ecom-assets" ON storage.objects;

CREATE POLICY "Authenticated list ecom-assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ecom-assets');
