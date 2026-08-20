import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider, useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  Loader2, 
  CreditCard, 
  Banknote, 
  Shield, 
  Check,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSavedAddress, SavedAddress } from "@/hooks/useSavedAddress";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "cod";

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

const CheckoutContent = () => {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const { savedAddress, loading: addressLoading, saveAddress } = useSavedAddress();
  const [useSaved, setUseSaved] = useState(false);
  
  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  // Check if user returned from canceled checkout
  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast.error("Payment was canceled. Your cart is still available.");
    }
  }, [searchParams]);

  // Pre-fill with saved address or user email
  useEffect(() => {
    if (savedAddress && !addressLoading) {
      setShipping(savedAddress);
      setUseSaved(true);
    } else if (user?.email && !shipping.email) {
      setShipping(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user, savedAddress, addressLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, name, value } = e.target;
    const fieldName = name || id;
    setShipping(prev => ({ ...prev, [fieldName]: value }));
    setUseSaved(false);
  };

  const validateForm = (): boolean => {
    if (!shipping.firstName || !shipping.lastName) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!shipping.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!shipping.address) {
      toast.error("Please enter your address");
      return false;
    }
    if (!shipping.city) {
      toast.error("Please enter your city");
      return false;
    }
    if (!shipping.postalCode) {
      toast.error("Please enter your postal code");
      return false;
    }
    if (!shipping.phone) {
      toast.error("Please enter your phone number");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!user) {
      toast.error("Please log in to complete your purchase");
      navigate("/auth");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    
    // Save address for future use
    saveAddress(shipping as SavedAddress);

    try {
      const shippingCost = items.length > 0 ? 200 : 0; // PKR 200 shipping
      const tax = Math.round(totalPrice * 0.05); // 5% tax
      const total = totalPrice + shippingCost + tax;

      const orderPayload = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category,
        })),
        shipping: {
          fullName: `${shipping.firstName} ${shipping.lastName}`,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          postalCode: shipping.postalCode,
        },
        subtotal: totalPrice,
        shippingCost,
        tax,
        total,
      };

      if (paymentMethod === "cod") {
        // Cash on Delivery - separate flow, no Stripe
        const { data, error } = await supabase.functions.invoke("create-cod-order", {
          body: orderPayload,
        });

        if (error) throw error;

        if (data?.orderId) {
          clearCart();
          toast.success("Order placed successfully!");
          navigate(`/order-confirmation/${data.orderId}?payment=cod`);
        } else {
          throw new Error("No order ID returned");
        }
      } else {
        // Card Payment via Stripe - don't clear cart before redirect
        // Cart persists in localStorage and will be cleared after successful payment
        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: orderPayload,
        });

        if (error) throw error;

        if (data?.url) {
          // Redirect to Stripe Checkout - cart remains in localStorage
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const shippingCost = items.length > 0 ? 200 : 0;
  const tax = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + shippingCost + tax;

  if (authLoading || addressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-6 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span>Continue Shopping</span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-heading font-semibold mb-6"
          >
            Secure Checkout
          </motion.h1>

          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
            >
              <p className="text-amber-800">
                Please{" "}
                <Link to="/auth" className="font-semibold underline">
                  log in
                </Link>{" "}
                to complete your purchase.
              </p>
            </motion.div>
          )}

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Link to="/shop">
                <Button>Browse Products</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* Cart Items - Compact */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border p-4 md:p-6"
                >
                  <h2 className="text-lg font-heading font-semibold mb-4">
                    Order Items ({items.length})
                  </h2>
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <Link to={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-20 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.id}`}>
                            <h3 className="font-medium text-sm truncate hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                          <p className="text-sm font-semibold mt-1">PKR {item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-muted transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-muted transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Shipping Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-xl border p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
                      <MapPin size={18} className="text-primary" />
                      Shipping Address
                    </h2>
                    {savedAddress && (
                      <AnimatePresence>
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          <Check size={12} />
                          Auto-filled
                        </motion.span>
                      </AnimatePresence>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        placeholder="Muhammad" 
                        className="mt-1.5" 
                        value={shipping.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        placeholder="Ali" 
                        className="mt-1.5" 
                        value={shipping.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder="muhammad@example.com" 
                        className="mt-1.5" 
                        value={shipping.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        type="tel" 
                        placeholder="+92 300 1234567" 
                        className="mt-1.5" 
                        value={shipping.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address" className="text-sm">Street Address *</Label>
                      <Input 
                        id="address" 
                        name="address"
                        placeholder="House 123, Street 45, Block A" 
                        className="mt-1.5" 
                        value={shipping.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-sm">City *</Label>
                      <Input 
                        id="city" 
                        name="city"
                        placeholder="Karachi" 
                        className="mt-1.5" 
                        value={shipping.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode" className="text-sm">Postal Code *</Label>
                      <Input 
                        id="postalCode" 
                        name="postalCode"
                        placeholder="75500" 
                        className="mt-1.5" 
                        value={shipping.postalCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Payment Method Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-xl border p-4 md:p-6"
                >
                  <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-primary" />
                    Payment Method
                  </h2>
                  
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="space-y-3"
                  >
                    {/* Card Payment */}
                    <label
                      htmlFor="payment-card"
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === "card"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value="card" id="payment-card" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-xs text-muted-foreground">Visa, Mastercard, UnionPay</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label
                      htmlFor="payment-cod"
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value="cod" id="payment-cod" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Banknote className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                        </div>
                      </div>
                    </label>
                  </RadioGroup>
                </motion.div>
              </div>

              {/* Order Summary - Right Column */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-1"
              >
                <div className="bg-card rounded-xl border p-4 md:p-6 sticky top-24">
                  <h2 className="text-lg font-heading font-semibold mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">PKR {totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">PKR {shippingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span className="font-medium">PKR {tax.toLocaleString()}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-base">
                      <span className="font-heading font-semibold">Total</span>
                      <span className="font-heading font-semibold text-primary">
                        PKR {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing || !user}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : paymentMethod === "cod" ? (
                      <>
                        <Banknote className="mr-2 h-4 w-4" />
                        Place Order (COD)
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay PKR {grandTotal.toLocaleString()}
                      </>
                    )}
                  </Button>

                  {paymentMethod === "card" && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Shield size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Secured by Stripe
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By placing this order, you agree to our{" "}
                    <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const Checkout = () => {
  return (
    <CartProvider>
      <CheckoutContent />
    </CartProvider>
  );
};

export default Checkout;
