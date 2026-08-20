import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-COD-ORDER] ${step}${detailsStr}`);
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

interface CODOrderRequest {
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
    const body: CODOrderRequest = await req.json();
    const { items, shipping, subtotal, shippingCost, tax, total } = body;
    logStep("Request body parsed", { itemCount: items.length, total });

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Create order in database with confirmed status (COD)
    const { data: orderData, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        subtotal: Math.round(subtotal),
        shipping_cost: Math.round(shippingCost),
        tax: Math.round(tax),
        total: Math.round(total),
        currency: "PKR",
        status: "confirmed",
        payment_status: "cod_pending",
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

    // Send order confirmation email (fire and forget - don't block response)
    const emailPayload = {
      to: shipping.email,
      customerName: shipping.fullName,
      orderNumber: orderData.order_number,
      orderId: orderData.id,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      subtotal,
      shippingCost,
      tax,
      total,
      shippingAddress: {
        address: shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
        phone: shipping.phone,
      },
      paymentMethod: "cod" as const,
    };

    // Send email in background
    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(emailPayload),
      }).then(res => {
        if (res.ok) {
          logStep("Order confirmation email sent");
        } else {
          logStep("Failed to send email", { status: res.status });
        }
      }).catch(err => {
        logStep("Email sending error", { error: err.message });
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        message: "Cash on Delivery order placed successfully"
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
      source: 'create-cod-order',
      eventType: isAuth ? 'auth_failure' : 'order_creation_failed',
      statusCode: 500,
      message: errorMessage,
    });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

});
