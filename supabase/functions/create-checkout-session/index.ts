import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

async function logSystem(args: {
  level: 'info' | 'warn' | 'error' | 'critical';
  source: string;
  eventType: string;
  statusCode?: number;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${url}/rest/v1/system_logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=minimal" },
      body: JSON.stringify({
        level: args.level, source: args.source, event_type: args.eventType,
        status_code: args.statusCode ?? null, message: args.message, metadata: args.metadata ?? {},
      }),
    });
    if (args.level === 'critical') {
      const alertEmail = Deno.env.get("SYSTEM_ALERT_EMAIL");
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (alertEmail && resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "alerts@resend.dev", to: [alertEmail],
            subject: `[ALERT] ${args.source}: ${args.eventType}`,
            html: `<h2>${args.source} - ${args.eventType}</h2><p><b>Status:</b> ${args.statusCode ?? '-'}</p><p>${args.message}</p><pre>${JSON.stringify(args.metadata ?? {}, null, 2)}</pre>`,
          }),
        });
      }
    }
  } catch (e) { console.error("logSystem failed", e); }
}


interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface CheckoutRequest {
  items: CartItem[];
  shipping: ShippingInfo;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create Supabase client with service role for creating orders
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { items, shipping, subtotal, shippingCost, tax, total } = body;
    logStep("Request body parsed", { itemCount: items.length, total });

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create order in database with pending status
    const { data: orderData, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        subtotal: Math.round(subtotal),
        shipping_cost: Math.round(shippingCost),
        tax: Math.round(tax),
        total: Math.round(total),
        currency: "PKR",
        status: "pending",
        payment_status: "pending",
        order_number: "TEMP", // Will be updated by trigger
      })
      .select()
      .single();

    if (orderError) {
      logStep("Order creation error", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }
    logStep("Order created", { orderId: orderData.id, orderNumber: orderData.order_number });

    // Create order items
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      product_name: item.name,
      product_image: item.image,
      quantity: item.quantity,
      unit_price: Math.round(item.price),
      total_price: Math.round(item.price * item.quantity),
    }));

    const { error: itemsError } = await supabaseClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      logStep("Order items creation error", itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }
    logStep("Order items created");

    // Create shipping address
    const { error: addressError } = await supabaseClient
      .from("shipping_addresses")
      .insert({
        order_id: orderData.id,
        full_name: shipping.fullName,
        email: shipping.email,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        postal_code: shipping.postalCode,
        country: "Pakistan",
      });

    if (addressError) {
      logStep("Shipping address creation error", addressError);
      throw new Error(`Failed to create shipping address: ${addressError.message}`);
    }
    logStep("Shipping address created");

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    // Create Stripe checkout session with dynamic pricing
    const lineItems = items.map(item => ({
      price_data: {
        currency: "pkr",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses smallest currency unit
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "pkr",
          product_data: {
            name: "Shipping",
            images: [],
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Add tax as a line item
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "pkr",
          product_data: {
            name: "Tax",
            images: [],
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://id-preview--57659834-e751-457b-8e63-50f3a02afecf.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/order-confirmation/${orderData.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      metadata: {
        order_id: orderData.id,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update order with payment intent ID from session
    if (session.payment_intent) {
      await supabaseClient
        .from("orders")
        .update({ payment_intent_id: session.payment_intent as string })
        .eq("id", orderData.id);
      logStep("Order updated with payment intent");
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        orderId: orderData.id,
        sessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    const isAuth = /authoriz|auth/i.test(errorMessage);
    await logSystem({
      level: isAuth ? 'critical' : 'error',
      source: 'create-checkout-session',
      eventType: isAuth ? 'auth_failure' : 'checkout_failed',
      statusCode: 500,
      message: errorMessage,
    });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

});
