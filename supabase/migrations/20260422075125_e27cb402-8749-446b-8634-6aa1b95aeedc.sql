CREATE TABLE public.org_footer_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  copyright_text text,
  contact_text text,
  contact_button_label text,
  contact_button_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.org_footer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view footer settings"
ON public.org_footer_settings
FOR SELECT
TO authenticated
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins insert footer settings"
ON public.org_footer_settings
FOR INSERT
TO authenticated
WITH CHECK (
  has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
);

CREATE POLICY "Org admins update footer settings"
ON public.org_footer_settings
FOR UPDATE
TO authenticated
USING (
  has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
);

CREATE POLICY "Org admins delete footer settings"
ON public.org_footer_settings
FOR DELETE
TO authenticated
USING (
  has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
);

CREATE TRIGGER update_org_footer_settings_updated_at
BEFORE UPDATE ON public.org_footer_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();