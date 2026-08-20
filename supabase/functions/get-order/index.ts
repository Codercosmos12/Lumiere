import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with anon key for RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get order ID from query params
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) throw new Error("Order ID is required");
    logStep("Order ID received", { orderId });

    // Fetch order (RLS will ensure user can only see their own orders)
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) {
      logStep("Order fetch error", orderError);
      throw new Error("Order not found or access denied");
    }
    logStep("Order fetched", { orderNumber: order.order_number });

    // Fetch order items
    const { data: items, error: itemsError } = await supabaseClient
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      logStep("Order items fetch error", itemsError);
    }

    // Fetch shipping address
    const { data: address, error: addressError } = await supabaseClient
      .from("shipping_addresses")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (addressError && addressError.code !== "PGRST116") {
      logStep("Address fetch error", addressError);
    }

    // Build response with order status message
    let statusMessage = "";
    switch (order.payment_status) {
      case "success":
        statusMessage = "Payment successful! Your order is being processed.";
        break;
      case "pending":
        statusMessage = "Payment is pending. Please complete your payment.";
        break;
      case "failed":
        statusMessage = "Payment failed. Please try again.";
        break;
      default:
        statusMessage = "Order received.";
    }

    const response = {
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentIntentId: order.payment_intent_id,
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost,
        tax: order.tax,
        total: order.total,
        currency: order.currency,
        createdAt: order.created_at,
      },
      items: items || [],
      shippingAddress: address || null,
      message: statusMessage,
    };

    logStep("Response prepared", { status: order.status, paymentStatus: order.payment_status });

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
