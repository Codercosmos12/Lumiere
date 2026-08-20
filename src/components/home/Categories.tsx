import { categories } from "@/data/products";
import { ArrowUpRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const Categories = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const canAddProduct = isAdmin || isSuperAdmin;

  return (
    <section id="categories" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-section mb-4">Shop by Category</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Explore our carefully curated collections
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -5 }}
              className="relative"
            >
              <Link
                to={`/category/${category.id}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg block"
              >
                <motion.img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-primary-foreground">
                  <motion.div 
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.2 }}
                  >
                    <div>
                      <h3 className="font-heading text-xl font-medium mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-primary-foreground/70">
                        {category.productCount} products
                      </p>
                    </div>
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center"
                      whileHover={{ scale: 1.15, backgroundColor: "rgba(255,255,255,0.25)" }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowUpRight size={18} />
                    </motion.div>
                  </motion.div>
                </div>
              </Link>
              
              {/* Admin Only - List Your Item Button */}
              {canAddProduct && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 right-3 z-10"
                >
                  <Link to={`/list-item/${category.id}`}>
                    <Button
                      size="sm"
                      className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg backdrop-blur-sm gap-1.5"
                    >
                      <Plus size={16} />
                      List Your Item
                    </Button>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
