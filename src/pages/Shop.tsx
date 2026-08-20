import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { CartProvider } from "@/context/CartContext";
import { ProductCard } from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const Shop = () => {
  const { products, dbProducts, loading, refetch } = useProducts();

  const dbProductIds = new Set(dbProducts.map((p) => p.id));

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <CartSidebar />
        
        <main className="flex-1">
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-4">
                  Shop All Products
                </h1>
                <p className="text-foreground/60 max-w-2xl mx-auto">
                  Discover our complete collection of premium fashion items crafted with care and attention to detail.
                </p>
              </motion.div>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {products.map((product, index) => (
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

export default Shop;
