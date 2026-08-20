import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        level: args.level,
        source: args.source,
        event_type: args.eventType,
        status_code: args.statusCode ?? null,
        message: args.message,
        metadata: args.metadata ?? {},
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
            from: "alerts@resend.dev",
            to: [alertEmail],
            subject: `[ALERT] ${args.source}: ${args.eventType}`,
            html: `<h2>${args.source} - ${args.eventType}</h2><p><b>Status:</b> ${args.statusCode ?? '-'}</p><p>${args.message}</p><pre>${JSON.stringify(args.metadata ?? {}, null, 2)}</pre>`,
          }),
        });
      }
    }
  } catch (e) {
    console.error("logSystem failed", e);
  }
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    logStep("Environment variables verified");

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Missing stripe-signature header");
      await logSystem({ level: 'critical', source: 'stripe-webhook', eventType: 'missing_signature', statusCode: 400, message: 'Missing stripe-signature header' });
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // Get raw body for signature verification
    const body = await req.text();
    logStep("Request body received", { length: body.length });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
      logStep("Webhook signature verified", { eventType: event.type, eventId: event.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      await logSystem({ level: 'critical', source: 'stripe-webhook', eventType: 'signature_verification_failed', statusCode: 400, message: errorMessage });
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { 
          sessionId: session.id,
          paymentStatus: session.payment_status,
          orderId: session.metadata?.order_id 
        });

        const orderId = session.metadata?.order_id;
        if (!orderId) {
          logStep("No order_id in session metadata");
          break;
        }

        if (session.payment_status === "paid") {
          // Update order status to confirmed and payment to success
          const { error: updateError } = await supabaseClient
            .from("orders")
            .update({
              status: "confirmed",
              payment_status: "success",
              payment_intent_id: session.payment_intent as string,
            })
            .eq("id", orderId);

          if (updateError) {
            logStep("Error updating order", updateError);
            throw new Error(`Failed to update order: ${updateError.message}`);
          }
          logStep("Order confirmed successfully", { orderId });

          // Fetch order details and send confirmation email
          const { data: orderData } = await supabaseClient
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

          const { data: orderItems } = await supabaseClient
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);

          const { data: shippingData } = await supabaseClient
            .from("shipping_addresses")
            .select("*")
            .eq("order_id", orderId)
            .single();

          if (orderData && orderItems && shippingData) {
            const emailPayload = {
              to: shippingData.email,
              customerName: shippingData.full_name,
              orderNumber: orderData.order_number,
              orderId: orderData.id,
              items: orderItems.map((item: { product_name: string; quantity: number; unit_price: number; product_image: string | null }) => ({
                name: item.product_name,
                quantity: item.quantity,
                price: item.unit_price,
                image: item.product_image,
              })),
              subtotal: orderData.subtotal,
              shippingCost: orderData.shipping_cost,
              tax: orderData.tax,
              total: orderData.total,
              shippingAddress: {
                address: shippingData.address,
                city: shippingData.city,
                postalCode: shippingData.postal_code,
                phone: shippingData.phone,
              },
              paymentMethod: "card" as const,
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
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.succeeded", { 
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount 
        });

        // Update any order with this payment intent ID
        const { error: updateError } = await supabaseClient
          .from("orders")
          .update({
            payment_status: "success",
            status: "confirmed",
          })
          .eq("payment_intent_id", paymentIntent.id);

        if (updateError) {
          logStep("Error updating order by payment intent", updateError);
        } else {
          logStep("Order updated via payment_intent.succeeded");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.payment_failed", { 
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message 
        });
        await logSystem({
          level: 'warn',
          source: 'stripe-webhook',
          eventType: 'payment_failed',
          message: paymentIntent.last_payment_error?.message ?? 'Payment failed',
          metadata: { paymentIntentId: paymentIntent.id },
        });

        const { error: updateError } = await supabaseClient
          .from("orders")
          .update({ payment_status: "failed", status: "pending" })
          .eq("payment_intent_id", paymentIntent.id);

        if (updateError) {
          logStep("Error updating failed payment order", updateError);
        } else {
          logStep("Order marked as payment failed");
        }
        break;
      }


      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    await logSystem({ level: 'critical', source: 'stripe-webhook', eventType: 'unhandled_error', statusCode: 500, message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

});
