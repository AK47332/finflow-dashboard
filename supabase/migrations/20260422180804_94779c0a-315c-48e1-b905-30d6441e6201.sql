
-- ============================================================
-- 1) Storefront pages (CMS): About, Contact, Shipping, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ecom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text DEFAULT '',
  show_in_footer boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

ALTER TABLE public.ecom_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pages"
ON public.ecom_pages FOR SELECT
USING (is_active = true OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members manage pages"
ON public.ecom_pages FOR ALL
USING (public.is_org_member(auth.uid(), organization_id))
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE TRIGGER trg_ecom_pages_updated_at
BEFORE UPDATE ON public.ecom_pages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ecom_pages_org_active ON public.ecom_pages(organization_id, is_active, sort_order);

-- ============================================================
-- 2) Storefront contact / chat widget settings (Chaty-style)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ecom_contact_widget (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  position text NOT NULL DEFAULT 'bottom-right', -- bottom-right | bottom-left
  greeting text DEFAULT 'Hi! How can we help you?',
  whatsapp_number text,           -- e.g. +8801XXXXXXXXX
  whatsapp_message text DEFAULT 'Hello, I have a question about your products.',
  messenger_username text,        -- facebook page username (m.me/<username>)
  phone_number text,              -- tel:+...
  email text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.ecom_contact_widget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contact widget"
ON public.ecom_contact_widget FOR SELECT
USING (true);

CREATE POLICY "Org admins manage contact widget"
ON public.ecom_contact_widget FOR ALL
USING (
  public.has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  OR public.has_org_role(auth.uid(), organization_id, 'admin'::app_role)
)
WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  OR public.has_org_role(auth.uid(), organization_id, 'admin'::app_role)
);

CREATE TRIGGER trg_ecom_contact_widget_updated_at
BEFORE UPDATE ON public.ecom_contact_widget
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
