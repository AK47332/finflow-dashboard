
-- Public bucket for income receipts/attachments
insert into storage.buckets (id, name, public)
values ('income-attachments', 'income-attachments', true)
on conflict (id) do nothing;

-- Allow anyone to read attachments (bucket is public)
create policy "Public read access to income attachments"
on storage.objects for select
using (bucket_id = 'income-attachments');

-- Allow anyone to upload (no auth yet — tighten when auth is added)
create policy "Anyone can upload income attachments"
on storage.objects for insert
with check (bucket_id = 'income-attachments');

-- Allow anyone to delete (so removing/replacing works)
create policy "Anyone can delete income attachments"
on storage.objects for delete
using (bucket_id = 'income-attachments');
