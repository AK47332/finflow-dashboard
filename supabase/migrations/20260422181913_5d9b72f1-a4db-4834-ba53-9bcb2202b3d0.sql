-- Expand org_footer_settings with full footer content
ALTER TABLE public.org_footer_settings
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS payment_badges text[] DEFAULT ARRAY['VISA','MC','AMEX']::text[];

-- Theme colors for storefront customization
ALTER TABLE public.org_frontend_settings
  ADD COLUMN IF NOT EXISTS theme_primary_color text,
  ADD COLUMN IF NOT EXISTS theme_accent_color text;
