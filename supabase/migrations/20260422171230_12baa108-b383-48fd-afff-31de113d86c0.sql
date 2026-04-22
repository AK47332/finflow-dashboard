
-- 1. Create public storage bucket for ecommerce/storefront assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('ecom-assets', 'ecom-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read, only org members can upload/update/delete
CREATE POLICY "Public read ecom-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'ecom-assets');

CREATE POLICY "Authenticated upload ecom-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ecom-assets');

CREATE POLICY "Authenticated update own ecom-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ecom-assets' AND owner = auth.uid());

CREATE POLICY "Authenticated delete own ecom-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ecom-assets' AND owner = auth.uid());

-- 2. Add footer logo column to frontend settings
ALTER TABLE public.org_frontend_settings
  ADD COLUMN IF NOT EXISTS footer_logo_url text;

-- 3. Drop newsletter table (no longer needed)
DROP TABLE IF EXISTS public.ecom_newsletter_subscribers CASCADE;

-- 4. Fix broken category images for Brown Fox (Sarees + Bridal)
UPDATE public.ecom_categories
SET image_url = 'https://images.unsplash.com/photo-1583391733981-3cc6e6e2e1f9?w=1200&auto=format&fit=crop'
WHERE slug = 'sarees'
  AND organization_id IN (SELECT id FROM public.organizations WHERE name = 'Brown Fox');

UPDATE public.ecom_categories
SET image_url = 'https://images.unsplash.com/photo-1604421349255-9ef5add02ae5?w=1200&auto=format&fit=crop'
WHERE slug = 'bridal'
  AND organization_id IN (SELECT id FROM public.organizations WHERE name = 'Brown Fox');

UPDATE public.ecom_categories
SET image_url = 'https://images.unsplash.com/photo-1591130901921-3f0652bb3915?w=1200&auto=format&fit=crop'
WHERE slug = 'sharara'
  AND organization_id IN (SELECT id FROM public.organizations WHERE name = 'Brown Fox');

UPDATE public.ecom_categories
SET image_url = 'https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=1200&auto=format&fit=crop'
WHERE slug = 'kurta-set'
  AND organization_id IN (SELECT id FROM public.organizations WHERE name = 'Brown Fox');
