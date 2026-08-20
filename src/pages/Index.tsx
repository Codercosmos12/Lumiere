import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { CategoryProducts } from "@/components/home/CategoryProducts";
import { Features } from "@/components/home/Features";
import { CartProvider } from "@/context/CartContext";

const Index = () => {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Hero />
          <Features />
          <CategoryProducts />
          <Categories />
        </main>
        <Footer />
        <CartSidebar />
      </div>
    </CartProvider>
  );
};

export default Index;
