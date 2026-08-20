-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  reviews INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

CREATE POLICY "Admins can create products"
ON public.products
FOR INSERT
WITH CHECK (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for category filtering
CREATE INDEX idx_products_category ON public.products(category);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND is_admin_or_superadmin(auth.uid()));