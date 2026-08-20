import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { CartProvider } from "@/context/CartContext";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        question: "How long does shipping take?",
        answer: "Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business day delivery. International orders may take 10-14 business days depending on the destination.",
      },
      {
        question: "Do you offer free shipping?",
        answer: "Yes! We offer free standard shipping on all orders over $100. For orders under $100, a flat rate of $8.95 applies.",
      },
      {
        question: "Can I track my order?",
        answer: "Absolutely! Once your order ships, you'll receive an email with a tracking number. You can use this to track your package on our website or the carrier's site.",
      },
      {
        question: "Do you ship internationally?",
        answer: "Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by location. You can see the exact cost at checkout.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    questions: [
      {
        question: "What is your return policy?",
        answer: "We offer a 30-day return policy for all unworn items with original tags attached. Items must be in their original condition. Sale items are final sale and cannot be returned.",
      },
      {
        question: "How do I initiate a return?",
        answer: "Simply log into your account, go to your order history, and select 'Return Item'. Follow the prompts to generate a prepaid return label. Pack your item securely and drop it off at any authorized shipping location.",
      },
      {
        question: "How long do refunds take?",
        answer: "Once we receive your return, please allow 5-7 business days for inspection and processing. Refunds are issued to your original payment method within 3-5 business days after approval.",
      },
      {
        question: "Can I exchange an item for a different size?",
        answer: "Yes! You can request an exchange during the return process. If the new size is available, we'll ship it as soon as we receive your return. Exchanges are free of charge.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    questions: [
      {
        question: "How do I find my correct size?",
        answer: "We have a detailed size guide available on each product page. We recommend measuring yourself and comparing to our size chart. If you're between sizes, we generally recommend sizing up for a more comfortable fit.",
      },
      {
        question: "Are your products true to size?",
        answer: "Most of our products run true to size. However, some styles may have specific fit notes mentioned in the product description. Check individual product pages for fit recommendations.",
      },
      {
        question: "What materials do you use?",
        answer: "We use premium, sustainably-sourced materials including organic cotton, recycled polyester, Tencel, and ethically-sourced wool. Material details are listed on each product page.",
      },
      {
        question: "How should I care for my items?",
        answer: "Care instructions are provided on the label of each item and on the product page. Generally, we recommend cold water washing, gentle cycles, and air drying to extend the life of your garments.",
      },
    ],
  },
  {
    category: "Payment & Security",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and Shop Pay. We also offer Klarna and Afterpay for interest-free installments.",
      },
      {
        question: "Is my payment information secure?",
        answer: "Absolutely. We use industry-standard SSL encryption to protect your personal and payment information. We never store your full credit card details on our servers.",
      },
      {
        question: "Do you offer gift cards?",
        answer: "Yes! Digital gift cards are available in amounts from $25 to $500. They never expire and can be used on any purchase. Gift cards are delivered via email immediately after purchase.",
      },
    ],
  },
  {
    category: "Account & Orders",
    questions: [
      {
        question: "Do I need an account to place an order?",
        answer: "No, you can checkout as a guest. However, creating an account allows you to track orders, save favorites, and enjoy a faster checkout experience.",
      },
      {
        question: "Can I cancel or modify my order?",
        answer: "You can cancel or modify your order within 1 hour of placing it. After that, orders enter our fulfillment process and cannot be changed. Please contact our support team immediately if you need assistance.",
      },
      {
        question: "How do I contact customer support?",
        answer: "You can reach us via email at support@lumiere.com, by phone at +1 (555) 123-4567 (Mon-Fri 9am-6pm EST), or through the Contact page on our website. We typically respond within 24 hours.",
      },
    ],
  },
];

const FAQ = () => {
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
                  Frequently Asked Questions
                </h1>
                <p className="text-foreground/60 max-w-2xl mx-auto">
                  Find answers to the most common questions about shopping with LUMIÈRE. 
                  Can't find what you're looking for? Contact our support team.
                </p>
              </motion.div>
              
              <div className="max-w-3xl mx-auto space-y-8">
                {faqs.map((category, categoryIndex) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                  >
                    <h2 className="text-xl font-heading font-semibold mb-4 text-primary">
                      {category.category}
                    </h2>
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.questions.map((faq, index) => (
                        <AccordionItem 
                          key={index} 
                          value={`${categoryIndex}-${index}`}
                          className="bg-muted/30 rounded-lg px-4 border-none"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground/70 pb-4">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </motion.div>
                ))}
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center mt-16 p-8 bg-muted/30 rounded-2xl max-w-2xl mx-auto"
              >
                <h3 className="text-xl font-heading font-semibold mb-2">
                  Still have questions?
                </h3>
                <p className="text-foreground/60 mb-4">
                  Our support team is here to help you with any questions.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Contact Support
                </a>
              </motion.div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </CartProvider>
  );
};

export default FAQ;
