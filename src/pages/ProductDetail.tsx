import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { CartProvider, useCart } from "@/context/CartContext";
import { useProductById, useProducts, deleteProduct } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, CreditCard, Star, Check, Loader2, Trash2 } from "lucide-react";
import { ProductReviews } from "@/components/product/ProductReviews";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
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

const ProductDetailContent = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { product, loading: productLoading } = useProductById(productId || "");
  const { products, dbProducts } = useProducts();

  // Check if this is a database product (UUID format)
  const isDbProduct = dbProducts.some(p => p.id === product?.id);
  const canDelete = (isAdmin || isSuperAdmin) && isDbProduct;

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted successfully!");
      navigate("/shop");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // Get related products from same category
  const relatedProducts = product 
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  if (productLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-semibold mb-4">Product Not Found</h1>
            <Link to="/shop" className="text-primary hover:underline">
              Back to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  // Create category slug from category name
  const categorySlug = product.category.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartSidebar />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-6">
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Shop</span>
          </Link>
        </div>

        {/* Product Detail */}
        <section className="pb-16 md:pb-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Product Image */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                {product.badge && (
                  <span
                    className={cn(
                      "absolute top-4 left-4 px-4 py-2 text-sm font-medium tracking-wide rounded-full",
                      product.badge === "Sale" && "bg-primary text-primary-foreground",
                      product.badge === "New" && "bg-foreground text-background",
                      product.badge === "Bestseller" && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {product.badge}
                  </span>
                )}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn(
                    "absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    isWishlisted
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/90 backdrop-blur-sm text-foreground hover:bg-background"
                  )}
                  aria-label="Add to wishlist"
                >
                  <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col"
              >
                {/* Category */}
                <Link 
                  to={`/category/${categorySlug}`}
                  className="text-sm text-muted-foreground uppercase tracking-wide mb-2 hover:text-primary transition-colors"
                >
                  {product.category}
                </Link>

                {/* Name */}
                <h1 className="text-3xl md:text-4xl font-heading font-semibold mb-4">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={cn(
                          i < Math.floor(product.rating)
                            ? "text-primary fill-primary"
                            : "text-muted fill-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl font-heading font-semibold">
                    PKR {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      PKR {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded">
                      Save PKR {(product.originalPrice - product.price).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  {product.description}
                </p>

                {/* Stock Status */}
                <div className="flex items-center gap-2 mb-6">
                  {product.inStock ? (
                    <>
                      <Check size={18} className="text-green-500" />
                      <span className="text-sm text-green-600">In Stock</span>
                    </>
                  ) : (
                    <span className="text-sm text-red-500">Out of Stock</span>
                  )}
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-lg hover:bg-muted transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-lg font-medium min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-lg hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    onClick={handleAddToCart}
                    size="lg"
                    variant="outline"
                    className="flex-1 gap-2"
                    disabled={!product.inStock}
                  >
                    <ShoppingBag size={20} />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    size="lg"
                    className="flex-1 gap-2"
                    disabled={!product.inStock}
                  >
                    <CreditCard size={20} />
                    Buy Now
                  </Button>
                </div>

                {/* Checkout Button */}
                <Link to="/checkout" className="w-full">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full gap-2"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>

                {/* Admin Delete Button */}
                {canDelete && (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    size="lg"
                    variant="destructive"
                    className="w-full gap-2 mt-4"
                  >
                    <Trash2 size={20} />
                    Delete Product
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <ProductReviews productId={productId || ""} />
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-heading font-semibold mb-8 text-center"
              >
                Related Products
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product?.name}"? This will permanently remove the product and all its reviews. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ProductDetail = () => {
  return (
    <CartProvider>
      <ProductDetailContent />
    </CartProvider>
  );
};

export default ProductDetail;
