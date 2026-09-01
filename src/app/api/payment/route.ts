import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // Read request body
    // ---------------------------------------------------------

    const body = await req.json();

    const {
      items,
      shipping,
      tax,
      user_id,
      price,
      total,
      fullName,
      phone,
      shippingAddress,
      customerEmail,
    } = body;

    // ---------------------------------------------------------
    // Validate required information
    // ---------------------------------------------------------

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing user_id.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No items were provided.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Create Stripe line items
    //
    // The products are sent directly to Stripe.
    // The webhook will retrieve these later.
    // ---------------------------------------------------------

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      items.map((item: any) => ({
        price_data: {
          currency: "usd",

          product_data: {
            name:
              item.name || "Glow Stick",

            description:
              item.description || "",
          },

          unit_amount: Math.round(
            Number(item.price || 0) * 100
          ),
        },

        quantity:
          Number(item.quantity) || 1,
      }));

    // ---------------------------------------------------------
    // Add shipping
    // ---------------------------------------------------------

    if (Number(shipping) > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Shipping",
          },

          unit_amount: Math.round(
            Number(shipping) * 100
          ),
        },

        quantity: 1,
      });
    }

    // ---------------------------------------------------------
    // Add tax
    // ---------------------------------------------------------

    if (Number(tax) > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Estimated Tax",
          },

          unit_amount: Math.round(
            Number(tax) * 100
          ),
        },

        quantity: 1,
      });
    }

    // ---------------------------------------------------------
    // Stripe metadata
    //
    // IMPORTANT:
    //
    // DO NOT put the cart/items into metadata.
    //
    // Stripe metadata has a 500-character limit per value.
    //
    // The webhook retrieves the actual purchased line items
    // directly from Stripe instead.
    // ---------------------------------------------------------

    const metadata: Stripe.MetadataParam = {
      user_id: String(user_id),

      price: Number(price || 0).toFixed(2),

      shipping: Number(
        shipping || 0
      ).toFixed(2),

      tax: Number(
        tax || 0
      ).toFixed(2),

      total: Number(
        total || 0
      ).toFixed(2),

      fullName: String(
        fullName || ""
      ),

      phone: String(
        phone || ""
      ),

      shippingAddress: String(
        shippingAddress || ""
      ),

      customerEmail: String(
        customerEmail || ""
      ),
    };

    // ---------------------------------------------------------
    // Website URL
    // ---------------------------------------------------------

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://glowrush.vercel.app";

    // ---------------------------------------------------------
    // Create Stripe Checkout Session
    // ---------------------------------------------------------

    const session =
      await stripe.checkout.sessions.create({
        payment_method_types: [
          "card",
        ],

        line_items: lineItems,

        mode: "payment",

        customer_email:
          customerEmail || undefined,

        // Keep only the compact metadata
        // needed by the webhook.
        metadata,

        success_url:
          `${baseUrl}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${baseUrl}/checkout?canceled=true`,
      });

    // ---------------------------------------------------------
    // Log Stripe session
    // ---------------------------------------------------------

    console.log(
      "Stripe Checkout Session created:",
      session.id
    );

    console.log(
      "Stripe Checkout URL:",
      session.url
    );

    // ---------------------------------------------------------
    // Return successful response
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,

      url: session.url,

      sessionId: session.id,
    });
  } catch (error: any) {
    // ---------------------------------------------------------
    // Stripe/payment error
    // ---------------------------------------------------------

    console.error(
      "======================================"
    );

    console.error(
      "STRIPE CHECKOUT ERROR:",
      error
    );

    console.error(
      "======================================"
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to create Stripe checkout session.",
      },
      {
        status: 500,
      }
    );
  }
}


