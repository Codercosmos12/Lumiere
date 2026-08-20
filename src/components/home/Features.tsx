import { RefreshCw, Shield } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day hassle-free return policy",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Your payment information is safe with us",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export const Features = () => {
  return (
    <section className="py-12 border-y border-border">
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid grid-cols-2 gap-8 max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature) => (
            <motion.div 
              key={feature.title} 
              className="text-center"
              variants={itemVariants}
            >
              <motion.div 
                className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <feature.icon size={22} className="text-primary" />
              </motion.div>
              <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
