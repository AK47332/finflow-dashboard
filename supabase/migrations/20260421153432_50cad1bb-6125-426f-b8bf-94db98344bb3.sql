-- Replace broad SELECT policy with one that blocks anonymous listing.
-- Direct file URLs still resolve because storage serves objects via signed paths.
DROP POLICY IF EXISTS "Public read org logos" ON storage.objects;

-- Authenticated org members can list/read logos for their orgs
CREATE POLICY "Org members read logos" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );