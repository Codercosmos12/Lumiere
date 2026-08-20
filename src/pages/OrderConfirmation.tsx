import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider, useCart } from "@/context/CartContext";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useParams, Navigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle, Package, MapPin, Loader2, XCircle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface OrderDetails {
  id: string;
  order_number: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_intent_id: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image: string | null;
}

interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "success":
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    case "pending":
      return <Clock className="w-8 h-8 text-amber-600" />;
    case "failed":
      return <XCircle className="w-8 h-8 text-red-600" />;
    default:
      return <Package className="w-8 h-8 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "success":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getOrderStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    case "shipped":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Shipped</Badge>;
    case "delivered":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const OrderConfirmationContent = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { clearCart, items } = useCart();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cartCleared = useRef(false);

  const sessionId = searchParams.get("session_id");
  const isCOD = searchParams.get("payment") === "cod";

  // Clear cart after successful order (for card payments returning from Stripe)
  useEffect(() => {
    if (sessionId && order && order.payment_status === "success" && !cartCleared.current && items.length > 0) {
      clearCart();
      cartCleared.current = true;
    }
  }, [order, sessionId, clearCart, items.length]);

  useEffect(() => {
    if (!orderId || authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    fetchOrderDetails();
    
    // Poll for updates if coming from checkout (payment might still be processing)
    if (sessionId) {
      const interval = setInterval(fetchOrderDetails, 3000);
      // Stop polling after 30 seconds
      setTimeout(() => clearInterval(interval), 30000);
      return () => clearInterval(interval);
    }
  }, [orderId, user, authLoading, sessionId]);

  const fetchOrderDetails = async () => {
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

      // Fetch shipping address
      const { data: addressData, error: addressError } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (addressError && addressError.code !== "PGRST116") throw addressError;
      setAddress(addressData);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Order not found or you don't have permission to view it.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaymentSuccess = order.payment_status === "success";
  const isPaymentPending = order.payment_status === "pending";
  const isPaymentFailed = order.payment_status === "failed";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartSidebar />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isPaymentSuccess ? "bg-green-100" : 
              isPaymentPending ? "bg-amber-100" : 
              "bg-red-100"
            }`}>
              {getStatusIcon(order.payment_status)}
            </div>
            <h1 className="text-3xl font-heading font-semibold mb-2">
              {isPaymentSuccess ? "Order Confirmed!" : 
               isPaymentPending ? "Payment Processing..." : 
               "Payment Failed"}
            </h1>
            <p className="text-muted-foreground">
              {isPaymentSuccess ? "Thank you for your order. We'll send you a confirmation email shortly." :
               isPaymentPending ? "Your payment is being processed. This page will update automatically." :
               "There was an issue with your payment. Please try again."}
            </p>
          </motion.div>

          <Card className="mb-6">
            <CardContent className="p-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-mono font-bold text-lg">{order.order_number}</p>
                </div>
                <div className="flex gap-2">
                  {getOrderStatusBadge(order.status)}
                  {getStatusBadge(order.payment_status)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                {order.payment_intent_id && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard size={14} />
                      Transaction ID
                    </p>
                    <p className="font-mono text-sm">{order.payment_intent_id}</p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-medium flex items-center gap-2 mb-4">
                  <Package size={18} />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      {item.product_image && (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.unit_price, order.currency)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.total_price, order.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Shipping Address */}
              {address && (
                <>
                  <div className="mb-6">
                    <h3 className="font-medium flex items-center gap-2 mb-4">
                      <MapPin size={18} />
                      Shipping Address
                    </h3>
                    <div className="bg-muted p-4 rounded-lg text-sm">
                      <p className="font-medium">{address.full_name}</p>
                      <p>{address.address}</p>
                      <p>{address.city}, {address.postal_code}</p>
                      <p>{address.country}</p>
                      <p className="text-muted-foreground mt-2">{address.phone}</p>
                      <p className="text-muted-foreground">{address.email}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />
                </>
              )}

              {/* Order Summary */}
              <div>
                <h3 className="font-medium mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatPrice(order.shipping_cost, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(order.tax, order.currency)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatPrice(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
            {isPaymentFailed && (
              <Button asChild variant="outline">
                <Link to="/checkout">Try Again</Link>
              </Button>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const OrderConfirmation = () => {
  return (
    <CartProvider>
      <OrderConfirmationContent />
    </CartProvider>
  );
};

export default OrderConfirmation;
