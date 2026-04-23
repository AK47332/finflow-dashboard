-- Services: add image
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS image_url text;

-- Receivables: add title + client_id link + attachment cols
ALTER TABLE public.receivables
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS document_type text;

-- Payables: add title + attachment cols (no client_id; vendor stays free-text)
ALTER TABLE public.payables
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS document_type text;

-- Notes: explicit note_date + attachment cols
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS note_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS document_type text;

-- New shared bucket for ledger / note attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ledger-attachments', 'ledger-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for files in this bucket
DROP POLICY IF EXISTS "Public read ledger-attachments" ON storage.objects;
CREATE POLICY "Public read ledger-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'ledger-attachments');

-- Authenticated members of an org can upload to that org's folder
DROP POLICY IF EXISTS "Org members upload ledger-attachments" ON storage.objects;
CREATE POLICY "Org members upload ledger-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ledger-attachments'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Org members update ledger-attachments" ON storage.objects;
CREATE POLICY "Org members update ledger-attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ledger-attachments'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Org members delete ledger-attachments" ON storage.objects;
CREATE POLICY "Org members delete ledger-attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ledger-attachments'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);