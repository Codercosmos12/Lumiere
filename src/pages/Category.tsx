import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { CartProvider } from "@/context/CartContext";
import { ProductCard } from "@/components/product/ProductCard";
import { useProductsByCategory, useProducts } from "@/hooks/useProducts";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const Category = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { products: categoryProducts, category, loading, refetch } = useProductsByCategory(categoryId || "");
  const { dbProducts } = useProducts();
  const dbProductIds = new Set(dbProducts.map((p) => p.id));
  
  const canAddProduct = isAdmin || isSuperAdmin;

  if (!categoryId) {
    return (
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-heading font-semibold mb-4">Category Not Found</h1>
              <Link to="/shop" className="text-primary hover:underline">
                Back to Shop
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  if (!category) {
    return (
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-heading font-semibold mb-4">Category Not Found</h1>
              <Link to="/shop" className="text-primary hover:underline">
                Back to Shop
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <CartSidebar />
        
        <main className="flex-1">
          {/* Category Hero */}
          <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center text-primary-foreground"
              >
                <h1 className="text-4xl md:text-6xl font-heading font-semibold mb-4">
                  {category.name}
                </h1>
                <p className="text-lg text-primary-foreground/80">
                  {categoryProducts.length} Products
                </p>
              </motion.div>
            </div>
          </section>

          {/* Back Button & Admin Add */}
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <Link 
              to="/shop" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Shop</span>
            </Link>
            {canAddProduct && (
              <Link to={`/add-item/${categoryId}`}>
                <Button className="gap-2">
                  <Plus size={18} />
                  Add Product
                </Button>
              </Link>
            )}
          </div>
          
          {/* Products Grid */}
          <section className="pb-16 md:pb-24">
            <div className="container mx-auto px-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">No products in this category yet.</p>
                  {canAddProduct && (
                    <Link to={`/add-item/${categoryId}`}>
                      <Button className="mt-4 gap-2">
                        <Plus size={18} />
                        Add First Product
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {categoryProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 1) }}
                    >
                      <ProductCard
                        product={product}
                        isDbProduct={dbProductIds.has(product.id)}
                        onProductChanged={refetch}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </CartProvider>
  );
};

export default Category;
