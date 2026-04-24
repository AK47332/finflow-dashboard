-- Ensure organization slugs are unique (case-insensitive) when set,
-- and provide a guard against reserved app routes so an admin can't
-- claim a slug like "auth", "dashboard", "settings", etc.

-- Unique partial index on lowercase slug (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_lower_unique
  ON public.organizations (lower(slug))
  WHERE slug IS NOT NULL AND slug <> '';

-- Reserved slug check (block app/system routes)
CREATE OR REPLACE FUNCTION public.check_org_slug_not_reserved()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  reserved text[] := ARRAY[
    'auth','onboarding','dashboard','income','expense','capital','profit',
    'clients','products','pos','services','receivables','payables','notes',
    'reminders','reports','settings','frontend-mood','admin','ecom','account',
    'shop','cart','checkout','product','page','api','assets','static','public',
    'storefront','s','store'
  ];
  norm text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    RETURN NEW;
  END IF;
  norm := lower(trim(NEW.slug));
  -- Format: lowercase letters, digits, hyphens, 2-40 chars, no leading/trailing hyphen
  IF norm !~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$' THEN
    RAISE EXCEPTION 'Invalid slug format: use lowercase letters, numbers and hyphens (2-40 characters, no leading/trailing hyphen).';
  END IF;
  IF norm = ANY(reserved) THEN
    RAISE EXCEPTION 'Slug "%" is reserved and cannot be used.', NEW.slug;
  END IF;
  NEW.slug := norm;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_slug_check ON public.organizations;
CREATE TRIGGER organizations_slug_check
  BEFORE INSERT OR UPDATE OF slug ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.check_org_slug_not_reserved();