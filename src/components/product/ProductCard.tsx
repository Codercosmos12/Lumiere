import { Heart, ShoppingBag, Pencil, Trash2 } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { deleteProduct } from "@/hooks/useProducts";
import { EditProductDialog } from "./EditProductDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductCardProps {
  product: Product;
  index?: number;
  isDbProduct?: boolean;
  onProductChanged?: () => void;
}

export const ProductCard = ({ product, index = 0, isDbProduct = false, onProductChanged }: ProductCardProps) => {
  const { addItem } = useCart();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = (isAdmin || isSuperAdmin) && isDbProduct;
  const canDelete = (isAdmin || isSuperAdmin) && isDbProduct;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted successfully!");
      onProductChanged?.();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <motion.div
        className="group relative overflow-hidden bg-card transition-shadow duration-500 hover:shadow-lg"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        {/* Admin actions - always visible */}
        {(canEdit || canDelete) && (
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            {canEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className="bg-background/90 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors shadow-md border border-border/50"
                aria-label="Edit product"
              >
                <Pencil size={14} className="text-foreground" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-destructive/90 text-destructive-foreground backdrop-blur-sm rounded-full p-2 hover:bg-destructive transition-colors shadow-md"
                aria-label="Delete product"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* Image */}
        <div className="relative">
          <Link to={`/product/${product.id}`} className="aspect-[3/4] overflow-hidden bg-muted block">
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </Link>

          {/* Badge */}
          {product.badge && (
            <motion.span
              className={cn(
                "absolute top-3 left-3 px-3 py-1 text-xs font-medium tracking-wide rounded-full",
                product.badge === "Sale" && "bg-primary text-primary-foreground",
                product.badge === "New" && "bg-foreground text-background",
                product.badge === "Bestseller" && "bg-secondary text-secondary-foreground"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {product.badge}
            </motion.span>
          )}

          {/* Hover overlay for quick actions */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2">
              <motion.button
                onClick={() => addItem(product)}
                className="flex-1 bg-background/95 backdrop-blur-sm text-foreground py-3 px-4 text-sm font-medium rounded-md hover:bg-background transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingBag size={16} />
                Add to Cart
              </motion.button>
              <motion.button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={cn(
                  "w-12 flex items-center justify-center rounded-md transition-colors",
                  isWishlisted
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/95 backdrop-blur-sm text-foreground hover:bg-background"
                )}
                aria-label="Add to wishlist"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <motion.p
            className="text-xs text-muted-foreground uppercase tracking-wide mb-1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {product.category}
          </motion.p>
          <h3 className="font-medium text-sm mb-2 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-medium">
              PKR {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                PKR {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <motion.svg
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < Math.floor(product.rating)
                      ? "text-primary fill-primary"
                      : "text-muted fill-muted"
                  )}
                  viewBox="0 0 20 20"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </motion.svg>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      {canEdit && (
        <EditProductDialog
          product={product}
          open={showEdit}
          onOpenChange={setShowEdit}
          onProductUpdated={() => onProductChanged?.()}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
