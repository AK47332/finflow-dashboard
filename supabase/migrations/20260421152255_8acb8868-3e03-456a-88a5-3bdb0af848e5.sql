-- ============================================================
-- PHASE 2: Clients, Products, Services, Receivables, Payables, Capital
-- ============================================================

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_org ON public.clients(organization_id);
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view clients" ON public.clients FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create clients" ON public.clients FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update clients" ON public.clients FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete clients" ON public.clients FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_org ON public.products(organization_id);
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view products" ON public.products FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create products" ON public.products FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update products" ON public.products FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete products" ON public.products FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- SERVICES
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_services_org ON public.services(organization_id);
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view services" ON public.services FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create services" ON public.services FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update services" ON public.services FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete services" ON public.services FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- RECEIVABLES (money owed TO us)
CREATE TYPE public.ledger_status AS ENUM ('pending', 'partial', 'paid', 'overdue');

CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  income_id UUID REFERENCES public.incomes(id) ON DELETE SET NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status public.ledger_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_receivables_org ON public.receivables(organization_id);
CREATE TRIGGER trg_receivables_updated_at BEFORE UPDATE ON public.receivables
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view receivables" ON public.receivables FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create receivables" ON public.receivables FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update receivables" ON public.receivables FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete receivables" ON public.receivables FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- PAYABLES (money WE owe)
CREATE TABLE public.payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  vendor_name TEXT NOT NULL,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status public.ledger_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payables_org ON public.payables(organization_id);
CREATE TRIGGER trg_payables_updated_at BEFORE UPDATE ON public.payables
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view payables" ON public.payables FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create payables" ON public.payables FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update payables" ON public.payables FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete payables" ON public.payables FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- CAPITAL MOVEMENTS
CREATE TYPE public.capital_type AS ENUM ('contribution', 'withdrawal');

CREATE TABLE public.capital_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  type public.capital_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.capital_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_capital_org ON public.capital_movements(organization_id);
CREATE TRIGGER trg_capital_updated_at BEFORE UPDATE ON public.capital_movements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view capital" ON public.capital_movements FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create capital" ON public.capital_movements FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update capital" ON public.capital_movements FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete capital" ON public.capital_movements FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));