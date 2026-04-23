-- Backfill: any user with a customer_subscription (Super-Admin-created)
-- but no organization membership gets an org auto-created and added as owner.
-- This unblocks any "stuck" admin accounts that wrongly landed on the customer storefront.
DO $$
DECLARE
  r RECORD;
  v_org_id uuid;
  v_name text;
BEGIN
  FOR r IN
    SELECT cs.user_id, p.full_name, p.email
    FROM public.customer_subscriptions cs
    LEFT JOIN public.profiles p ON p.user_id = cs.user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = cs.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = cs.user_id
    )
  LOOP
    v_name := COALESCE(
      NULLIF(TRIM(r.full_name), ''),
      split_part(COALESCE(r.email, 'My'), '@', 1),
      'My'
    ) || '''s Workspace';

    INSERT INTO public.organizations (name, created_by)
    VALUES (v_name, r.user_id)
    RETURNING id INTO v_org_id;

    -- handle_new_organization() trigger normally adds owner membership.
    -- Make sure it exists in case the trigger isn't attached.
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, r.user_id, 'owner')
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles
    SET current_org_id = v_org_id
    WHERE user_id = r.user_id AND current_org_id IS NULL;
  END LOOP;
END $$;

-- Also ensure handle_new_organization trigger exists (it's referenced but may not be attached).
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();