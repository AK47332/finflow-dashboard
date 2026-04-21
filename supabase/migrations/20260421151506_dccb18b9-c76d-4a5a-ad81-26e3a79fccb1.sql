-- ============================================================
-- PHASE 1: Multi-tenant foundation
-- profiles, organizations, organization_members, roles, helpers
-- ============================================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');

-- Profiles (one per auth user)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  current_org_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Organizations (one per client/business)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USD',
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Membership (which user belongs to which org with which role)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

-- ============================================================
-- SECURITY DEFINER helper functions (avoid recursive RLS)
-- ============================================================

-- Is the user a member of the org?
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  );
$$;

-- Does the user have a specific role in the org?
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role = _role
  );
$$;

-- Get the user's current active org id (from profile)
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_org_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- ============================================================
-- updated_at trigger function (shared)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- profiles: users can read/update their own profile; can also read profiles of org-mates
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- organizations: only members can see; only owner can update/delete; any authenticated can create
CREATE POLICY "Members view their organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Authenticated users create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (public.has_org_role(auth.uid(), id, 'owner'));

CREATE POLICY "Owners delete their organization"
ON public.organizations FOR DELETE
TO authenticated
USING (public.has_org_role(auth.uid(), id, 'owner'));

-- organization_members
CREATE POLICY "Members view membership of their orgs"
ON public.organization_members FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- Allow inserting yourself as member when creating an org (we'll handle owner add via trigger below)
CREATE POLICY "Owners and admins add members"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner')
  OR public.has_org_role(auth.uid(), organization_id, 'admin')
  OR user_id = auth.uid()  -- allows the bootstrap insert when creating an org
);

CREATE POLICY "Owners and admins update members"
ON public.organization_members FOR UPDATE
TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, 'owner')
  OR public.has_org_role(auth.uid(), organization_id, 'admin')
);

CREATE POLICY "Owners remove members; users can remove themselves"
ON public.organization_members FOR DELETE
TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, 'owner')
  OR user_id = auth.uid()
);

-- ============================================================
-- Auto-add creator as owner when an organization is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  -- Set as current org if user has none yet
  UPDATE public.profiles
  SET current_org_id = NEW.id
  WHERE user_id = NEW.created_by AND current_org_id IS NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- ============================================================
-- PHASE 1.4: Migrate Income & Expense to Cloud (org-scoped)
-- ============================================================

CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'General',
  category TEXT NOT NULL,
  client TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  description TEXT,
  is_partial BOOLEAN NOT NULL DEFAULT false,
  remaining_due NUMERIC(14,2),
  tags TEXT[],
  document_name TEXT,
  document_type TEXT,
  document_path TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_incomes_org ON public.incomes(organization_id);
CREATE INDEX idx_incomes_date ON public.incomes(date);

CREATE TRIGGER trg_incomes_updated_at
BEFORE UPDATE ON public.incomes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view incomes"
ON public.incomes FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members create incomes"
ON public.incomes FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Org members update incomes"
ON public.incomes FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members delete incomes"
ON public.incomes FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence TEXT,
  next_due_date DATE,
  tags TEXT[],
  document_name TEXT,
  document_type TEXT,
  document_path TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_expenses_org ON public.expenses(organization_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);

CREATE TRIGGER trg_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view expenses"
ON public.expenses FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members create expenses"
ON public.expenses FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Org members update expenses"
ON public.expenses FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members delete expenses"
ON public.expenses FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));