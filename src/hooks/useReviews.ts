import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data as Review[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();

    // Realtime subscription
    const channel = supabase
      .channel(`reviews-${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_reviews",
          filter: `product_id=eq.${productId}`,
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return { reviews, loading, refetch: fetchReviews };
};

export const createReview = async (review: {
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
}) => {
  const { data, error } = await supabase
    .from("product_reviews")
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data as Review;
};

export const deleteReview = async (reviewId: string) => {
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) throw error;
};
