
-- Drop the overly broad SELECT policy that allowed listing all files
drop policy if exists "Public read access to income attachments" on storage.objects;
-- Files in this public bucket remain accessible via their direct public URL.
