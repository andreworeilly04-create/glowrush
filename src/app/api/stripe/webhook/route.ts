import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    // =========================================================
    // 1. Get RAW Stripe webhook body
    // =========================================================

    const body = await req.text();

    // =========================================================
    // 2. Get Stripe signature
    // =========================================================

    const signature =
      req.headers.get("stripe-signature");

    if (!signature) {
      console.error(
        "Webhook error: Missing stripe-signature header."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Missing Stripe signature.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 3. Get webhook secret
    // =========================================================

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_KEY;

    if (!webhookSecret) {
      console.error(
        "Webhook error: STRIPE_WEBHOOK_KEY is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "STRIPE_WEBHOOK_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 4. Verify Stripe webhook
    // =========================================================

    let event: Stripe.Event;

    try {
      event =
        stripe.webhooks.constructEvent(
          body,
          signature,
          webhookSecret
        );
    } catch (error: any) {
      console.error(
        "Webhook signature verification failed:",
        error?.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Stripe webhook signature.",
        },
        { status: 400 }
      );
    }

    console.log(
      "======================================"
    );

    console.log(
      "STRIPE WEBHOOK RECEIVED"
    );

    console.log(
      "Event type:",
      event.type
    );

    console.log(
      "Event ID:",
      event.id
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 5. Only process completed Checkout Sessions
    // =========================================================

    if (
      event.type !==
      "checkout.session.completed"
    ) {
      console.log(
        "Ignoring Stripe event:",
        event.type
      );

      return NextResponse.json({
        success: true,
        received: true,
        ignored: true,
      });
    }

    // =========================================================
    // 6. Get Checkout Session
    // =========================================================

    const session =
      event.data.object as Stripe.Checkout.Session;

    console.log(
      "Stripe Checkout Session:",
      session.id
    );

    // =========================================================
    // 7. Make sure payment was successful
    // =========================================================

    if (
      session.payment_status !==
      "paid"
    ) {
      console.log(
        "Payment is not paid:",
        session.payment_status
      );

      return NextResponse.json({
        success: true,
        received: true,
        ignored: true,
        reason:
          "Payment was not completed.",
      });
    }

    console.log(
      "PAYMENT CONFIRMED AS PAID"
    );

    // =========================================================
    // 8. Read Stripe metadata
    // =========================================================

    const metadata =
      session.metadata || {};

    const userId =
      metadata.user_id;

    console.log(
      "Stripe metadata:",
      metadata
    );

    console.log(
      "User ID from Stripe:",
      userId
    );

    if (
      !userId ||
      typeof userId !== "string" ||
      userId.trim() === ""
    ) {
      console.error(
        "Webhook error: Missing user_id in Stripe metadata."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing user_id in Stripe metadata.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 9. Firebase Admin orders collection
    // =========================================================

    const ordersRef =
      adminDb.collection("orders");

    // =========================================================
    // 10. Prevent duplicate orders
    // =========================================================

    const existingOrdersSnapshot =
      await ordersRef
        .where(
          "stripeSessionId",
          "==",
          session.id
        )
        .limit(1)
        .get();

    if (
      !existingOrdersSnapshot.empty
    ) {
      const existingOrder =
        existingOrdersSnapshot.docs[0];

      console.log(
        "======================================"
      );

      console.log(
        "ORDER ALREADY EXISTS"
      );

      console.log(
        "Firestore Order ID:",
        existingOrder.id
      );

      console.log(
        "Stripe Session ID:",
        session.id
      );

      console.log(
        "======================================"
      );

      return NextResponse.json({
        success: true,
        received: true,
        alreadyExists: true,
        orderId:
          existingOrder.id,
      });
    }

    // =========================================================
    // 11. Get purchased items from Stripe
    // =========================================================

    const stripeLineItems =
      await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          limit: 100,

          expand: [
            "data.price.product",
          ],
        }
      );

    console.log(
      "Stripe line items found:",
      stripeLineItems.data.length
    );

    if (
      stripeLineItems.data.length ===
      0
    ) {
      console.error(
        "Webhook error: No Stripe line items found."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No line items found for Stripe session.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 12. Convert Stripe products to Firestore items
    // =========================================================

    const orderItems =
      stripeLineItems.data.map(
        (
          lineItem: Stripe.LineItem
        ) => {
          const product =
            lineItem.price?.product;

          let productName =
            "Glow Stick";

          let description = "";

          let image = "";

          // ---------------------------------------------------
          // Read product information from Stripe
          // ---------------------------------------------------

          if (
            typeof product ===
              "object" &&
            product !== null &&
            !("deleted" in product)
          ) {
            productName =
              product.name ||
              "Glow Stick";

            description =
              product.description ||
              "";

            // -------------------------------------------------
            // Get product image
            // -------------------------------------------------

            if (
              Array.isArray(
                product.images
              ) &&
              product.images.length > 0
            ) {
              image =
                product.images[0];

              console.log(
                "Product image found:",
                image
              );
            } else {
              console.warn(
                "No Stripe product image found for:",
                productName
              );
            }
          }

          // ---------------------------------------------------
          // Price
          // ---------------------------------------------------

          const unitAmount =
            lineItem.price
              ?.unit_amount || 0;

          // ---------------------------------------------------
          // Quantity
          // ---------------------------------------------------

          const quantity =
            Number(
              lineItem.quantity
            ) || 1;

          console.log(
            "Stripe item:",
            {
              name: productName,
              quantity,
              price:
                unitAmount / 100,
              image,
            }
          );

          return {
            name: productName,

            description,

            price:
              unitAmount / 100,

            quantity,

            image,
          };
        }
      );

    // =========================================================
    // 13. Get totals from metadata
    // =========================================================

    const price =
      Number(metadata.price) || 0;

    const shipping =
      Number(metadata.shipping) || 0;

    const tax =
      Number(metadata.tax) || 0;

    const total =
      Number(metadata.total) || 0;

    // =========================================================
    // 14. Customer information
    // =========================================================

    const customerEmail =
      metadata.customerEmail ||
      session.customer_details
        ?.email ||
      "";

    const fullName =
      metadata.fullName ||
      session.customer_details
        ?.name ||
      "";

    const phone =
      metadata.phone ||
      session.customer_details
        ?.phone ||
      "";

    const shippingAddress =
      metadata.shippingAddress ||
      "";

    // =========================================================
    // 15. Payment Intent ID
    // =========================================================

    const paymentIntentId =
      typeof session.payment_intent ===
      "string"
        ? session.payment_intent
        : session.payment_intent?.id ||
          null;

    // =========================================================
    // 16. Create Firestore order
    // =========================================================

    const now =
      new Date().toISOString();

    const orderData = {
      user_id:
        String(userId),

      items:
        orderItems,

      price,

      shipping,

      tax,

      total,

      fullName,

      phone,

      shippingAddress,

      customerEmail,

      status:
        "Paid / Processing",

      paymentStatus:
        "paid",

      paymentMethod:
        "Stripe",

      stripeSessionId:
        session.id,

      stripePaymentIntentId:
        paymentIntentId,

      createdAt:
        now,

      paidAt:
        now,
    };

    console.log(
      "======================================"
    );

    console.log(
      "CREATING FIRESTORE ORDER"
    );

    console.log(
      "User ID:",
      userId
    );

    console.log(
      "Stripe Session:",
      session.id
    );

    console.log(
      "Order items:",
      orderItems
    );

    console.log(
      "Order data:",
      orderData
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 17. Save using Firebase Admin SDK
    // =========================================================

    const docRef =
      await ordersRef.add(
        orderData
      );

    // =========================================================
    // 18. Success
    // =========================================================

    console.log(
      "======================================"
    );

    console.log(
      "PAID ORDER CREATED SUCCESSFULLY"
    );

    console.log(
      "Firestore Order ID:",
      docRef.id
    );

    console.log(
      "Stripe Session ID:",
      session.id
    );

    console.log(
      "User ID:",
      userId
    );

    console.log(
      "Product images saved:",
      orderItems.map(
        (item) => item.image
      )
    );

    console.log(
      "======================================"
    );

    return NextResponse.json({
      success: true,

      received: true,

      orderId:
        docRef.id,
    });
  } catch (error: any) {
    console.error(
      "======================================"
    );

    console.error(
      "STRIPE WEBHOOK ERROR"
    );

    console.error(
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
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}