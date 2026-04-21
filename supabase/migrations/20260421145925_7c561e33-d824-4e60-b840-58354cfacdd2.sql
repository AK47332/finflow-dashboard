
-- Public bucket for expense receipts/attachments
insert into storage.buckets (id, name, public)
values ('expense-attachments', 'expense-attachments', true)
on conflict (id) do nothing;

-- Allow anyone to upload (no auth yet — tighten when auth is added)
create policy "Anyone can upload expense attachments"
on storage.objects for insert
with check (bucket_id = 'expense-attachments');

-- Allow anyone to delete (so removing/replacing works)
create policy "Anyone can delete expense attachments"
on storage.objects for delete
using (bucket_id = 'expense-attachments');
-- Note: no SELECT policy — files are accessed via their public URL only.
