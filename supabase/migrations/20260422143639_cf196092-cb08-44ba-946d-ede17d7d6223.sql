-- ============================================
-- ECOMMERCE PHASE 1 SCHEMA
-- ============================================

-- 1. Frontend Mood per organization
CREATE TYPE public.frontend_mode AS ENUM ('private', 'ecommerce', 'landing');

CREATE TABLE public.org_frontend_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  mode public.frontend_mode NOT NULL DEFAULT 'private',
  is_primary boolean NOT NULL DEFAULT false,
  store_name text,
  store_tagline text,
  store_logo_url text,
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  hero_cta_label text,
  hero_cta_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enforce only one primary org globally
CREATE UNIQUE INDEX org_frontend_settings_one_primary
  ON public.org_frontend_settings ((1)) WHERE is_primary = true;

ALTER TABLE public.org_frontend_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view frontend settings"
  ON public.org_frontend_settings FOR SELECT
  USING (true);

CREATE POLICY "Org admins manage frontend settings"
  ON public.org_frontend_settings FOR ALL
  USING (
    public.has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  )
  WITH CHECK (
    public.has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  );

-- 2. Ecommerce categories
CREATE TABLE public.ecom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.ecom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ecom categories"
  ON public.ecom_categories FOR SELECT
  USING (is_active = true OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members manage ecom categories"
  ON public.ecom_categories FOR ALL
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

-- 3. Ecommerce extras for existing products (1:1)
CREATE TABLE public.ecom_product_extras (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ecom_category_id uuid REFERENCES public.ecom_categories(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  short_description text,
  long_description text,
  compare_at_price numeric,
  image_urls text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  slug text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.ecom_product_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published product extras"
  ON public.ecom_product_extras FOR SELECT
  USING (is_published = true OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members manage product extras"
  ON public.ecom_product_extras FOR ALL
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- 4. Storefront banners
CREATE TABLE public.ecom_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  image_url text,
  cta_label text,
  cta_url text,
  position text NOT NULL DEFAULT 'hero',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecom_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON public.ecom_banners FOR SELECT
  USING (is_active = true OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members manage banners"
  ON public.ecom_banners FOR ALL
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

-- 5. Ecommerce customers (linked to auth.users, scoped per org)
CREATE TABLE public.ecom_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.ecom_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own record"
  ON public.ecom_customers FOR SELECT
  USING (user_id = auth.uid() OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Customers insert own record"
  ON public.ecom_customers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers update own record"
  ON public.ecom_customers FOR UPDATE
  USING (user_id = auth.uid() OR public.is_org_member(auth.uid(), organization_id));

-- helper: check if user is an ecom customer of an org
CREATE OR REPLACE FUNCTION public.is_ecom_customer(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ecom_customers
    WHERE user_id = _user_id AND organization_id = _org_id
  );
$$;

-- 6. Customer addresses
CREATE TABLE public.ecom_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.ecom_customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label text,
  full_name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'US',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecom_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Address owner access"
  ON public.ecom_addresses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.ecom_customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
    OR public.is_org_member(auth.uid(), organization_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ecom_customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

-- 7. Orders
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE public.order_payment_status AS ENUM ('unpaid', 'paid', 'refunded');

CREATE TABLE public.ecom_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.ecom_customers(id) ON DELETE SET NULL,
  order_number text NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.order_payment_status NOT NULL DEFAULT 'unpaid',
  payment_method text NOT NULL DEFAULT 'cod',
  contact_email text,
  contact_phone text,
  shipping_full_name text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, order_number)
);

ALTER TABLE public.ecom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own orders, org members view all"
  ON public.ecom_orders FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
    OR EXISTS (SELECT 1 FROM public.ecom_customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Customers create orders for self"
  ON public.ecom_orders FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ecom_customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Org members update orders"
  ON public.ecom_orders FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members delete orders"
  ON public.ecom_orders FOR DELETE
  USING (public.is_org_member(auth.uid(), organization_id));

-- 8. Order items
CREATE TABLE public.ecom_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.ecom_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  unit_price numeric NOT NULL,
  quantity numeric NOT NULL,
  line_total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecom_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View order items via parent order"
  ON public.ecom_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ecom_orders o
      WHERE o.id = order_id
        AND (
          public.is_org_member(auth.uid(), o.organization_id)
          OR EXISTS (SELECT 1 FROM public.ecom_customers c WHERE c.id = o.customer_id AND c.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Insert order items via own order"
  ON public.ecom_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ecom_orders o
      JOIN public.ecom_customers c ON c.id = o.customer_id
      WHERE o.id = order_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members update order items"
  ON public.ecom_order_items FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.ecom_orders o WHERE o.id = order_id AND public.is_org_member(auth.uid(), o.organization_id))
  );

-- triggers for updated_at
CREATE TRIGGER trg_org_frontend_settings_updated BEFORE UPDATE ON public.org_frontend_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ecom_categories_updated BEFORE UPDATE ON public.ecom_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ecom_product_extras_updated BEFORE UPDATE ON public.ecom_product_extras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ecom_banners_updated BEFORE UPDATE ON public.ecom_banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ecom_customers_updated BEFORE UPDATE ON public.ecom_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ecom_addresses_updated BEFORE UPDATE ON public.ecom_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ecom_orders_updated BEFORE UPDATE ON public.ecom_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- order number sequence helper
CREATE SEQUENCE IF NOT EXISTS public.ecom_order_seq START 1000;