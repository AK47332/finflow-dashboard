-- Allow anonymous visitors to read organizations so the public storefront can resolve a default org.
CREATE POLICY "Anyone can view organizations"
ON public.organizations
FOR SELECT
TO anon, authenticated
USING (true);