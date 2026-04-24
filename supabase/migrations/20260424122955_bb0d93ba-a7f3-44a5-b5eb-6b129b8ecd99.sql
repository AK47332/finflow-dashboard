CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique_idx
  ON public.organizations (lower(slug))
  WHERE slug IS NOT NULL;