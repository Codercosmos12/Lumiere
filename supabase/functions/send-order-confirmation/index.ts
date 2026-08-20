import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderEmailRequest {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: "card" | "cod";
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-ORDER-CONFIRMATION] ${step}${detailsStr}`);
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const generateOrderItemsHtml = (items: OrderItem[]) => {
  return items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
          <span style="font-weight: 500;">${item.name}</span>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const data: OrderEmailRequest = await req.json();
    logStep("Request data received", { orderNumber: data.orderNumber, to: data.to });

    const paymentMethodText = data.paymentMethod === "cod" 
      ? "Cash on Delivery" 
      : "Credit/Debit Card (Paid)";

    const paymentStatusBadge = data.paymentMethod === "cod"
      ? `<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">Payment on Delivery</span>`
      : `<span style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">Paid</span>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed! ✓</h1>
              <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Thank you for shopping with us</p>
            </div>

            <!-- Main Content -->
            <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Greeting -->
              <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
                Hi <strong>${data.customerName}</strong>,<br><br>
                We've received your order and it's being processed. Here are the details:
              </p>

              <!-- Order Info Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                  <div>
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Order Number</p>
                    <p style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0; font-family: monospace;">${data.orderNumber}</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Payment Method</p>
                    ${paymentStatusBadge}
                  </div>
                </div>
              </div>

              <!-- Order Items -->
              <h2 style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0; font-weight: 600;">Order Items</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Product</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Price</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${generateOrderItemsHtml(data.items)}
                </tbody>
              </table>

              <!-- Order Summary -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #64748b;">Subtotal</span>
                  <span style="color: #374151;">${formatPrice(data.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #64748b;">Shipping</span>
                  <span style="color: #374151;">${formatPrice(data.shippingCost)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="color: #64748b;">Tax</span>
                  <span style="color: #374151;">${formatPrice(data.tax)}</span>
                </div>
                <div style="border-top: 2px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between;">
                  <span style="font-weight: 700; color: #0f172a; font-size: 18px;">Total</span>
                  <span style="font-weight: 700; color: #0f172a; font-size: 18px;">${formatPrice(data.total)}</span>
                </div>
              </div>

              <!-- Shipping Address -->
              <h2 style="font-size: 16px; color: #1e293b; margin: 0 0 12px 0; font-weight: 600;">Shipping Address</h2>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #374151; line-height: 1.6;">
                  <strong>${data.customerName}</strong><br>
                  ${data.shippingAddress.address}<br>
                  ${data.shippingAddress.city}, ${data.shippingAddress.postalCode}<br>
                  Pakistan<br>
                  <span style="color: #64748b;">Phone: ${data.shippingAddress.phone}</span>
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/order-confirmation/${data.orderId}" 
                   style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View Order Details
                </a>
              </div>

              <!-- Footer Note -->
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 32px 0 0 0; line-height: 1.6;">
                ${data.paymentMethod === "cod" 
                  ? "Please keep the exact amount ready at the time of delivery." 
                  : "A receipt has been sent to your email for your records."}
              </p>
            </div>

            <!-- Email Footer -->
            <div style="text-align: center; padding: 24px;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                If you have any questions, reply to this email or contact our support team.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
                © ${new Date().getFullYear()} Your Store. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Store <onboarding@resend.dev>",
      to: [data.to],
      subject: `Order Confirmed - ${data.orderNumber}`,
      html: emailHtml,
    });

    logStep("Email sent successfully", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
