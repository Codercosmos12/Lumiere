import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Product, CartItem } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  cartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Local storage helpers for guest cart
const GUEST_CART_KEY = "guest-cart";
const loadGuestCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};
const saveGuestCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {}
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const prevUserId = useRef<string | null>(null);
  const isSyncing = useRef(false);

  // Load cart from DB for authenticated users
  const loadDbCart = useCallback(async (userId: string) => {
    setCartLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", userId);

      if (error) throw error;
      if (!data || data.length === 0) {
        setItems([]);
        setCartLoading(false);
        return;
      }

      // Fetch product details for each cart item
      const productIds = data.map((ci) => ci.product_id);
      
      // Try DB products first
      const { data: dbProducts } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      // Also check static products
      const { products: staticProducts } = await import("@/data/products");

      const cartItems: CartItem[] = [];
      for (const ci of data) {
        // Check DB products
        const dbP = dbProducts?.find((p) => p.id === ci.product_id);
        if (dbP) {
          cartItems.push({
            id: dbP.id,
            name: dbP.name,
            price: dbP.price,
            originalPrice: dbP.original_price ?? undefined,
            image: dbP.image_url,
            category: dbP.category,
            description: dbP.description,
            rating: Number(dbP.rating),
            reviews: dbP.reviews,
            inStock: dbP.in_stock,
            badge: dbP.badge ?? undefined,
            quantity: ci.quantity,
          });
          continue;
        }
        // Check static products
        const staticP = staticProducts.find((p) => p.id === ci.product_id);
        if (staticP) {
          cartItems.push({ ...staticP, quantity: ci.quantity });
        }
        // If product not found, skip (was deleted)
      }

      setItems(cartItems);
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Sync a single item change to DB
  const syncToDb = useCallback(async (userId: string, productId: string, quantity: number) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    try {
      if (quantity <= 0) {
        await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
      } else {
        await supabase.from("cart_items").upsert(
          { user_id: userId, product_id: productId, quantity },
          { onConflict: "user_id,product_id" }
        );
      }
    } catch (err) {
      console.error("Failed to sync cart:", err);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // Merge guest cart into DB on login
  const mergeGuestCart = useCallback(async (userId: string) => {
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) return;

    try {
      for (const item of guestItems) {
        await supabase.from("cart_items").upsert(
          { user_id: userId, product_id: item.id, quantity: item.quantity },
          { onConflict: "user_id,product_id" }
        );
      }
      localStorage.removeItem(GUEST_CART_KEY);
    } catch (err) {
      console.error("Failed to merge guest cart:", err);
    }
  }, []);

  // Handle user changes (login/logout)
  useEffect(() => {
    const userId = user?.id ?? null;
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (userId) {
      // User logged in: merge guest cart then load from DB
      mergeGuestCart(userId).then(() => loadDbCart(userId));
    } else {
      // User logged out: load guest cart
      setItems(loadGuestCart());
    }
  }, [user, loadDbCart, mergeGuestCart]);

  // Save guest cart to localStorage when items change and not logged in
  useEffect(() => {
    if (!user) {
      saveGuestCart(items);
    }
  }, [items, user]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const newQuantity = existing ? existing.quantity + 1 : 1;
      
      if (user) {
        syncToDb(user.id, product.id, newQuantity);
      }

      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsOpen(true);
  }, [user, syncToDb]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
    if (user) {
      syncToDb(user.id, productId, 0);
    }
  }, [user, syncToDb]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
    if (user) {
      syncToDb(user.id, productId, quantity);
    }
  }, [user, removeItem, syncToDb]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      try {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to clear cart:", err);
      }
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [user]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
        cartLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
