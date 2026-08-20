import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { products as staticProducts, categories } from "@/data/products";

interface DbProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  in_stock: boolean;
  badge: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const mapDbProductToProduct = (dbProduct: DbProduct): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  price: dbProduct.price,
  originalPrice: dbProduct.original_price ?? undefined,
  image: dbProduct.image_url,
  category: dbProduct.category,
  description: dbProduct.description,
  rating: Number(dbProduct.rating),
  reviews: dbProduct.reviews,
  inStock: dbProduct.in_stock,
  badge: dbProduct.badge ?? undefined,
});

export const useProducts = () => {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data as DbProduct[]).map(mapDbProductToProduct);
      setDbProducts(mapped);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Combine static products with database products
  const allProducts = [...dbProducts, ...staticProducts];

  return { products: allProducts, dbProducts, loading, error, refetch: fetchProducts };
};

export const useProductsByCategory = (categoryId: string) => {
  const { products, loading, error, refetch } = useProducts();

  // Map category ID to category name
  const categoryMap: Record<string, string> = {
    "anime-world": "Anime World",
    "accessories": "Accessories",
    "electronics": "Electronics",
    "cloths": "Cloths",
  };

  const categoryName = categoryMap[categoryId] || categoryId;
  
  const categoryProducts = products.filter(
    (p) => p.category === categoryName || p.category === categoryId
  );

  // Get category info
  const category = categories.find((cat) => cat.id === categoryId);

  return { 
    products: categoryProducts, 
    category,
    loading, 
    error, 
    refetch 
  };
};

export const useProductById = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      // First check static products
      const staticProduct = staticProducts.find((p) => p.id === productId);
      if (staticProduct) {
        setProduct(staticProduct);
        setLoading(false);
        return;
      }

      // Then check database
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (error) throw error;

        if (data) {
          setProduct(mapDbProductToProduct(data as DbProduct));
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const createProduct = async (product: {
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  description: string;
  badge?: string;
}): Promise<Product> => {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      price: product.price,
      original_price: product.originalPrice || null,
      image_url: product.imageUrl,
      category: product.category,
      description: product.description,
      badge: product.badge || null,
    })
    .select()
    .single();

  if (error) throw error;

  return mapDbProductToProduct(data as DbProduct);
};

export const updateProduct = async (
  productId: string,
  product: {
    name?: string;
    price?: number;
    originalPrice?: number | null;
    imageUrl?: string;
    category?: string;
    description?: string;
    badge?: string | null;
  }
): Promise<Product> => {
  const updateData: Record<string, unknown> = {};
  if (product.name !== undefined) updateData.name = product.name;
  if (product.price !== undefined) updateData.price = product.price;
  if (product.originalPrice !== undefined) updateData.original_price = product.originalPrice;
  if (product.imageUrl !== undefined) updateData.image_url = product.imageUrl;
  if (product.category !== undefined) updateData.category = product.category;
  if (product.description !== undefined) updateData.description = product.description;
  if (product.badge !== undefined) updateData.badge = product.badge;

  const { data, error } = await supabase
    .from("products")
    .update(updateData as never)
    .eq("id", productId)
    .select()
    .single();



  if (error) throw error;

  return mapDbProductToProduct(data as DbProduct);
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw error;
};
