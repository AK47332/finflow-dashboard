ALTER TABLE public.password_changes
  ADD COLUMN IF NOT EXISTS password_preview text;