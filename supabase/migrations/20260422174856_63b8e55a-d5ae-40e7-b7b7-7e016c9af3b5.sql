-- Add parent_id to support subcategories (self-referencing)
ALTER TABLE public.ecom_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL REFERENCES public.ecom_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ecom_categories_parent_id ON public.ecom_categories(parent_id);