-- Delete related reviews when a product is deleted (can't use FK due to type mismatch)
CREATE OR REPLACE FUNCTION public.cascade_delete_product_reviews()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.product_reviews WHERE product_id = OLD.id::text;
  RETURN OLD;
END;
$$;

CREATE TRIGGER cascade_delete_product_reviews_trigger
BEFORE DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.cascade_delete_product_reviews();

-- Delete product images from storage on product deletion
CREATE OR REPLACE FUNCTION public.cleanup_product_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.image_url LIKE '%product-images%' THEN
    PERFORM storage.delete('product-images', ARRAY[
      regexp_replace(OLD.image_url, '^.*/product-images/', '')
    ]);
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_product_storage_trigger
BEFORE DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_product_storage();