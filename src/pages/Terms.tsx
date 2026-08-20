import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsContent = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartSidebar />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-heading font-semibold mb-8">
              Terms & Conditions
            </h1>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <p className="text-muted-foreground">
                Last updated: January 2026
              </p>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using LUMIÈRE's website and services, you accept and agree to be bound by 
                  these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">2. Use of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You may use our services only for lawful purposes and in accordance with these Terms. 
                  You agree not to use our services in any way that violates any applicable law or regulation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">3. Account Registration</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To access certain features, you may be required to register for an account. You agree to provide 
                  accurate, current, and complete information during registration and to update such information 
                  to keep it accurate, current, and complete.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">4. Orders and Payments</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All orders are subject to acceptance and availability. We reserve the right to refuse any order. 
                  Prices are subject to change without notice. Payment must be made at the time of purchase through 
                  our secure payment gateway powered by Stripe.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">5. Shipping and Delivery</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We aim to deliver your order within the estimated timeframe. However, delivery times are not 
                  guaranteed and may vary based on location and other factors. Risk of loss and title for items 
                  purchased pass to you upon delivery.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">6. Returns and Refunds</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Please refer to our <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link> for 
                  detailed information about returns and refunds.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">7. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All content on this website, including text, graphics, logos, images, and software, is the 
                  property of LUMIÈRE and is protected by intellectual property laws. You may not reproduce, 
                  distribute, or create derivative works without our express permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  LUMIÈRE shall not be liable for any indirect, incidental, special, consequential, or punitive 
                  damages resulting from your use of or inability to use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">9. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately 
                  upon posting to the website. Your continued use of our services after any changes indicates 
                  your acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms, please contact us at{" "}
                  <Link to="/contact" className="text-primary hover:underline">our contact page</Link>.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const Terms = () => {
  return (
    <CartProvider>
      <TermsContent />
    </CartProvider>
  );
};

export default Terms;
