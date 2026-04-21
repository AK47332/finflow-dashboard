-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  summary TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view activity" ON public.activity_logs FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create activity" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND user_id = auth.uid());

CREATE INDEX idx_activity_org_created ON public.activity_logs(organization_id, created_at DESC);

-- Invitations
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status invite_status NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_by UUID,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Helper to check current user's email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

CREATE POLICY "Org admins view invitations" ON public.invitations FOR SELECT TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
    OR lower(email) = lower(current_user_email())
  );
CREATE POLICY "Org admins create invitations" ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (
    (has_org_role(auth.uid(), organization_id, 'owner'::app_role)
     OR has_org_role(auth.uid(), organization_id, 'admin'::app_role))
    AND invited_by = auth.uid()
  );
CREATE POLICY "Org admins update invitations" ON public.invitations FOR UPDATE TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
    OR lower(email) = lower(current_user_email())
  );
CREATE POLICY "Org admins delete invitations" ON public.invitations FOR DELETE TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  );

CREATE TRIGGER set_updated_at_invitations BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX idx_invitations_email ON public.invitations(lower(email));

-- Categories table for Settings (per-org income/expense categories)
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, kind, name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view categories" ON public.categories FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org admins update categories" ON public.categories FOR UPDATE TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  );
CREATE POLICY "Org admins delete categories" ON public.categories FOR DELETE TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  );

CREATE TRIGGER set_updated_at_categories BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_categories_org ON public.categories(organization_id, kind);

-- Storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read org logos" ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');
CREATE POLICY "Org members upload logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Org admins update logos" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND (
      has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'owner'::app_role)
      OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::app_role)
    )
  );
CREATE POLICY "Org admins delete logos" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND (
      has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'owner'::app_role)
      OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::app_role)
    )
  );