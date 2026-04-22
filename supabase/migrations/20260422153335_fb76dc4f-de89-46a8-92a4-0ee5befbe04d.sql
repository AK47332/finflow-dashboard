-- Allow anonymous visitors to read products that are published in a primary ecommerce storefront
CREATE POLICY "Anyone can view published storefront products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ecom_product_extras ext
    JOIN public.org_frontend_settings ofs
      ON ofs.organization_id = ext.organization_id
    WHERE ext.product_id = products.id
      AND ext.is_published = true
      AND ofs.mode = 'ecommerce'
  )
);