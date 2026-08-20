import { products } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { motion } from "framer-motion";
export const FeaturedProducts = () => {
  return <section id="products" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12" initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6
      }}>
          <div>
            <motion.h2 className="heading-section mb-2 text-center" initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6,
            delay: 0.1
          }}>
              Featured Collection
            </motion.h2>
            <motion.p className="text-muted-foreground" initial={{
            opacity: 0
          }} whileInView={{
            opacity: 1
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }}>
              Handpicked pieces from our latest arrivals
            </motion.p>
          </div>
          <motion.a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4" initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: 0.3
        }} whileHover={{
          x: 5
        }}>
            View All Products
          </motion.a>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
      </div>
    </section>;
};