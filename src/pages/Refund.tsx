import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const RefundContent = () => {
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
              Refund Policy
            </h1>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <p className="text-muted-foreground">
                Last updated: January 2026
              </p>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">1. Return Eligibility</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We accept returns within 30 days of delivery for most items. To be eligible for a return, 
                  your item must be:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                  <li>In the same condition that you received it</li>
                  <li>Unworn, unwashed, and with tags attached</li>
                  <li>In the original packaging</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">2. Non-Returnable Items</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The following items cannot be returned:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                  <li>Items marked as final sale</li>
                  <li>Intimate apparel and swimwear</li>
                  <li>Personalized or custom-made items</li>
                  <li>Items damaged through misuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">3. How to Initiate a Return</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To initiate a return, please follow these steps:
                </p>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mt-4">
                  <li>Contact our customer service team via the <Link to="/contact" className="text-primary hover:underline">contact page</Link></li>
                  <li>Provide your order number and reason for return</li>
                  <li>Wait for return authorization and shipping instructions</li>
                  <li>Pack the item securely and ship it to the provided address</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">4. Refund Process</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Once we receive your return, we will inspect the item and notify you of the refund status. 
                  If approved, your refund will be processed within 5-10 business days to your original 
                  payment method.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">5. Refund Timeline</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Please note the following timeline:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                  <li>Item inspection: 2-3 business days after receiving the return</li>
                  <li>Refund processing: 5-10 business days after approval</li>
                  <li>Bank processing: Additional 5-10 business days depending on your bank</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">6. Return Shipping</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Customers are responsible for return shipping costs unless the item is defective or 
                  we made an error. We recommend using a trackable shipping method for your protection.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">7. Exchanges</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not offer direct exchanges. If you need a different size or color, please return 
                  the original item for a refund and place a new order.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">8. Damaged or Defective Items</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you receive a damaged or defective item, please contact us immediately with photos of 
                  the damage. We will arrange for a replacement or full refund at no additional cost to you.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">9. Late or Missing Refunds</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you haven't received a refund within the expected timeframe:
                </p>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mt-4">
                  <li>Check your bank account again</li>
                  <li>Contact your credit card company (processing may take time)</li>
                  <li>Contact your bank</li>
                  <li>If you've done all of this and still haven't received your refund, contact us</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mt-8 mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about our Refund Policy, please contact us at{" "}
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

const Refund = () => {
  return (
    <CartProvider>
      <RefundContent />
    </CartProvider>
  );
};

export default Refund;
