-- Password change audit table (records that a change happened — never the value)
CREATE TABLE IF NOT EXISTS public.password_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_changes_user_id_idx ON public.password_changes(user_id);
CREATE INDEX IF NOT EXISTS password_changes_changed_at_idx ON public.password_changes(changed_at DESC);

ALTER TABLE public.password_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own password change" ON public.password_changes;
CREATE POLICY "Users insert own password change"
  ON public.password_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own password changes" ON public.password_changes;
CREATE POLICY "Users view own password changes"
  ON public.password_changes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- Helper: highest role for a user in an org
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid, _org_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  ORDER BY
    CASE role::text
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'account_manager' THEN 3
      WHEN 'store_manager' THEN 4
      WHEN 'sales_manager' THEN 5
      WHEN 'member' THEN 6
      ELSE 7
    END
  LIMIT 1;
$$;