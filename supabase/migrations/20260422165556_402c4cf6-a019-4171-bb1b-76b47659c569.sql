
-- 1. Announcements (top scrolling bar items)
CREATE TABLE public.ecom_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  icon TEXT DEFAULT '✦',
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecom_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON public.ecom_announcements FOR SELECT
  USING (is_active = true OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members manage announcements"
  ON public.ecom_announcements FOR ALL
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE TRIGGER trg_ecom_announcements_updated
BEFORE UPDATE ON public.ecom_announcements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ecom_announcements_org ON public.ecom_announcements(organization_id, sort_order);

-- 2. Instagram posts
CREATE TABLE public.ecom_instagram_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecom_instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active instagram posts"
  ON public.ecom_instagram_posts FOR SELECT
  USING (is_active = true OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members manage instagram posts"
  ON public.ecom_instagram_posts FOR ALL
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE TRIGGER trg_ecom_instagram_posts_updated
BEFORE UPDATE ON public.ecom_instagram_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ecom_instagram_org ON public.ecom_instagram_posts(organization_id, sort_order);

-- 3. Newsletter subscribers
CREATE TABLE public.ecom_newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  source TEXT DEFAULT 'footer',
  is_unsubscribed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

ALTER TABLE public.ecom_newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.ecom_newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members view subscribers"
  ON public.ecom_newsletter_subscribers FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members update subscribers"
  ON public.ecom_newsletter_subscribers FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members delete subscribers"
  ON public.ecom_newsletter_subscribers FOR DELETE
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE TRIGGER trg_ecom_newsletter_updated
BEFORE UPDATE ON public.ecom_newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ecom_newsletter_org ON public.ecom_newsletter_subscribers(organization_id, created_at DESC);
