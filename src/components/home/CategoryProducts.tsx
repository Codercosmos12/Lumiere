import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { ProductCard } from "@/components/product/ProductCard";
import { categories } from "@/data/products";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const CategoryProducts = () => {
  const { products, dbProducts, loading, refetch } = useProducts();
  const { isAdmin, isSuperAdmin } = useAuth();
  const canAdd = isAdmin || isSuperAdmin;

  const dbProductIds = new Set(dbProducts.map((p) => p.id));

  // Group products by category
  const grouped = categories.map((cat) => {
    const categoryMap: Record<string, string> = {
      "anime-world": "Anime World",
      accessories: "Accessories",
      electronics: "Electronics",
      cloths: "Cloths",
    };
    const catName = categoryMap[cat.id] || cat.name;
    const catProducts = products.filter(
      (p) => p.category === catName || p.category === cat.id
    );
    return { category: cat, products: catProducts };
  });

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-section mb-4">All Products</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Browse products organized by category
          </p>
        </motion.div>

        {/* Admin Add Product Button */}
        {canAdd && (
          <motion.div
            className="flex justify-center mb-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Link to="/add-item">
              <Button size="lg" className="gap-2">
                <Plus size={20} />
                Add Product
              </Button>
            </Link>
          </motion.div>
        )}

        {grouped.map(({ category, products: catProducts }, catIdx) => {
          if (catProducts.length === 0) return null;
          return (
            <motion.div
              key={category.id}
              className="mb-16 last:mb-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: catIdx * 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-heading font-semibold">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {catProducts.length} products
                  </p>
                </div>
                <div className="flex gap-2">
                  {canAdd && (
                    <Link to={`/add-item/${category.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Plus size={16} />
                        Add to {category.name}
                      </Button>
                    </Link>
                  )}
                  <Link
                    to={`/category/${category.id}`}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4 self-center"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {catProducts.slice(0, 4).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    isDbProduct={dbProductIds.has(product.id)}
                    onProductChanged={refetch}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
