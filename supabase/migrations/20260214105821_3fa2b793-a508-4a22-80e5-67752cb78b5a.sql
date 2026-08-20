
-- Allow admins to also delete products (not just superadmins)
DROP POLICY IF EXISTS "Superadmins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));
