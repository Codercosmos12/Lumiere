import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useReviews, createReview, deleteReview } from "@/hooks/useReviews";
import { Star, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user, isSuperAdmin } = useAuth();
  const { reviews, loading } = useReviews(productId);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to leave a review");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setSubmitting(true);
    try {
      await createReview({
        product_id: productId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || "Anonymous",
        rating,
        comment: comment.trim(),
      });
      setComment("");
      setRating(5);
      toast.success("Review submitted!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <section className="py-12">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="text-primary" size={24} />
        <h2 className="text-2xl font-heading font-semibold">
          Reviews ({reviews.length})
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <Star size={16} className="text-primary fill-primary" />
            <span className="text-sm font-medium">{avgRating}</span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-10 p-6 rounded-lg border bg-card">
          <h3 className="font-medium mb-4">Write a Review</h3>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  size={24}
                  className={cn(
                    "transition-colors",
                    (hoverRating || rating) >= star
                      ? "text-primary fill-primary"
                      : "text-muted"
                  )}
                />
              </button>
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              {rating}/5
            </span>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={3}
            className="mb-4"
          />
          <Button type="submit" disabled={submitting} size="sm">
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground mb-8 p-4 border rounded-lg bg-card">
          Please <a href="/auth" className="text-primary underline">log in</a> to leave a review.
        </p>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 border rounded-lg bg-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={cn(
                            review.rating >= star
                              ? "text-primary fill-primary"
                              : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="Delete review"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/80">{review.comment}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};
