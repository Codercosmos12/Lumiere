import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface SavedAddress {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

const STORAGE_KEY = "savedShippingAddress";

export const useSavedAddress = () => {
  const { user } = useAuth();
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved address from local storage or last order
  useEffect(() => {
    const loadAddress = async () => {
      setLoading(true);
      
      // First try local storage
      const storedAddress = localStorage.getItem(STORAGE_KEY);
      if (storedAddress) {
        try {
          setSavedAddress(JSON.parse(storedAddress));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // If user is logged in, try to fetch from last order
      if (user) {
        try {
          const { data: orders } = await supabase
            .from("orders")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (orders && orders.length > 0) {
            const { data: shippingData } = await supabase
              .from("shipping_addresses")
              .select("*")
              .eq("order_id", orders[0].id)
              .single();

            if (shippingData) {
              const nameParts = shippingData.full_name.split(" ");
              const address: SavedAddress = {
                firstName: nameParts[0] || "",
                lastName: nameParts.slice(1).join(" ") || "",
                email: shippingData.email,
                address: shippingData.address,
                city: shippingData.city,
                postalCode: shippingData.postal_code,
                phone: shippingData.phone,
              };
              setSavedAddress(address);
              // Also save to local storage for faster loading next time
              localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
            }
          }
        } catch (error) {
          console.error("Error loading saved address:", error);
        }
      }
      
      setLoading(false);
    };

    loadAddress();
  }, [user]);

  const saveAddress = (address: SavedAddress) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
    setSavedAddress(address);
  };

  const clearSavedAddress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedAddress(null);
  };

  return {
    savedAddress,
    loading,
    saveAddress,
    clearSavedAddress,
  };
};
