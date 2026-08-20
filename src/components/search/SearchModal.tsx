import { useState, useEffect, useMemo } from "react";
import { X, Search, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { products } from "@/data/products";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";
import { Input } from "@/components/ui/input";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, []);

  // Search and filter products
  const searchResults = useMemo(() => {
    let filtered = products;

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.description.toLowerCase().includes(lowerQuery) ||
          product.category.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    return filtered;
  }, [query, selectedCategory]);

  // Get similar products based on category
  const getSimilarProducts = (product: Product): Product[] => {
    return products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  };

  // Popular/trending products (based on reviews)
  const trendingProducts = useMemo(() => {
    return [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 md:pt-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-4xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[80vh] flex flex-col"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Search Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 border-0 text-lg focus-visible:ring-0 px-0 placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {query.trim() === "" && !selectedCategory ? (
                /* Show trending when no search */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Trending Products</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {trendingProducts.map((product) => (
                      <div key={product.id} onClick={onClose}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-8">
                  {/* Search Results */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Found {searchResults.length} product
                      {searchResults.length !== 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.map((product) => (
                        <div key={product.id} onClick={onClose}>
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Similar Products Section */}
                  {searchResults.length > 0 && searchResults.length < 4 && (
                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-lg mb-4">
                        Similar Products
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {searchResults
                          .flatMap((product) => getSimilarProducts(product))
                          .filter(
                            (product, index, self) =>
                              self.findIndex((p) => p.id === product.id) ===
                                index &&
                              !searchResults.find((r) => r.id === product.id)
                          )
                          .slice(0, 6)
                          .map((product) => (
                            <div key={product.id} onClick={onClose}>
                              <ProductCard product={product} />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No results */
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No products found</h3>
                  <p className="text-muted-foreground">
                    Try searching with different keywords or browse categories
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
