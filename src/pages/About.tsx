import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { CartProvider } from "@/context/CartContext";
import { motion } from "framer-motion";
import { Gem, Shirt, Smile, Shield, Eye, Lock } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Gem,
      title: "Premium Quality",
      description:
        "We focus on offering products made from carefully selected materials with attention to detail.",
    },
    {
      icon: Shirt,
      title: "Modern Style",
      description:
        "Our collections are inspired by contemporary fashion trends while maintaining timeless appeal.",
    },
    {
      icon: Smile,
      title: "Customer Satisfaction",
      description:
        "We prioritize customer experience and continuously improve our products and services based on feedback.",
    },
    {
      icon: Shield,
      title: "Secure Shopping",
      description:
        "Your privacy and security are important to us, and we are committed to providing a safe online shopping experience.",
    },
  ];

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <CartSidebar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto"
              >
                <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-6">
                  About Us
                </h1>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  Welcome to LUMIÈRE – where style meets quality.
                </p>
                <p className="text-lg text-foreground/70 leading-relaxed mt-4">
                  At LUMIÈRE, we are committed to providing premium fashion products that combine modern trends with timeless design. Our goal is simple: to help people express their individuality through clothing that looks great, feels comfortable, and lasts.
                </p>
                <p className="text-lg text-foreground/70 leading-relaxed mt-4">
                  We carefully select every product in our collection to ensure high standards of quality, craftsmanship, and customer satisfaction. Whether you&apos;re looking for everyday essentials or statement pieces, we strive to offer fashion that fits your lifestyle.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6">
                    Our Mission
                  </h2>
                  <div className="space-y-4 text-foreground/70">
                    <p>
                      To make high-quality fashion accessible while delivering an exceptional shopping experience through innovation, reliability, and customer-focused service.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative"
                >
                  <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-6xl font-heading font-bold text-primary/30">L</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-4">
                  Why Choose Us?
                </h2>
                <p className="text-foreground/60 max-w-2xl mx-auto">
                  Thank you for choosing LUMIÈRE. We look forward to being a part of your style journey.
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {values.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="bg-background rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-foreground/60">{value.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust & Security Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-4">
                  Your Trust & Security
                </h2>
                <p className="text-foreground/60 max-w-2xl mx-auto">
                  We take every measure to protect your personal information and ensure a safe shopping experience.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-background rounded-xl p-8 border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Eye className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3">Privacy First</h3>
                  <p className="text-foreground/60 leading-relaxed">
                    Your personal data is collected only to fulfill orders and improve your experience. We never sell your information to third parties, and you can request deletion of your data at any time.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-background rounded-xl p-8 border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3">Secure Shopping</h3>
                  <p className="text-foreground/60 leading-relaxed">
                    All transactions are processed through Stripe with industry-standard SSL encryption. Your payment details are never stored on our servers, ensuring a safe and worry-free checkout every time.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default About;
