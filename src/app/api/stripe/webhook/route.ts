import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. Get RAW Stripe webhook body
    // ---------------------------------------------------------

    const body = await req.text();

    // ---------------------------------------------------------
    // 2. Get Stripe signature
    // ---------------------------------------------------------

    const signature = req.headers.get(
      "stripe-signature"
    );

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

    // ---------------------------------------------------------
    // 3. Get webhook secret
    //
    // Your environment variable is:
    // STRIPE_WEBHOOK_KEY
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 4. Verify Stripe webhook
    // ---------------------------------------------------------

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
      "Stripe webhook received:",
      event.type
    );

    // ---------------------------------------------------------
    // 5. Only process checkout.session.completed
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 6. Get Stripe Checkout Session
    // ---------------------------------------------------------

    const session =
      event.data.object as Stripe.Checkout.Session;

    console.log(
      "Stripe Checkout Session:",
      session.id
    );

    // ---------------------------------------------------------
    // 7. Make absolutely sure payment was successful
    // ---------------------------------------------------------

    if (
      session.payment_status !==
      "paid"
    ) {
      console.log(
        "Payment was not completed.",
        "Payment status:",
        session.payment_status
      );

      // IMPORTANT:
      // No Firestore order is created here.
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

    // ---------------------------------------------------------
    // 8. Read Stripe metadata
    // ---------------------------------------------------------

    const metadata =
      session.metadata || {};

    const userId =
      metadata.user_id;

    if (!userId) {
      console.error(
        "Webhook error: No user_id in Stripe metadata."
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

    console.log(
      "Stripe user ID:",
      userId
    );

    // ---------------------------------------------------------
    // 9. Firestore orders collection
    // ---------------------------------------------------------

    const ordersRef =
      collection(db, "orders");

    // ---------------------------------------------------------
    // 10. Prevent duplicate orders
    // ---------------------------------------------------------

    const existingOrderQuery =
      query(
        ordersRef,
        where(
          "stripeSessionId",
          "==",
          session.id
        )
      );

    const existingOrders =
      await getDocs(
        existingOrderQuery
      );

    if (!existingOrders.empty) {
      console.log(
        "Order already exists for Stripe session:",
        session.id
      );

      return NextResponse.json({
        success: true,
        received: true,
        alreadyExists: true,
      });
    }

    // ---------------------------------------------------------
    // 11. Get purchased items from Stripe
    //
    // We do NOT store the entire cart in Stripe metadata.
    // This avoids the 500-character metadata limit.
    // ---------------------------------------------------------

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
      "Stripe line items:",
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

    // ---------------------------------------------------------
    // 12. Convert Stripe items into Firestore items
    // ---------------------------------------------------------

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
          }

          const unitAmount =
            lineItem.price
              ?.unit_amount || 0;

          const quantity =
            lineItem.quantity || 1;

          return {
            name: productName,

            description,

            price:
              unitAmount / 100,

            quantity,

            image: "",
          };
        }
      );

    // ---------------------------------------------------------
    // 13. Get totals
    //
    // These are small metadata values, so they stay safely
    // under Stripe's metadata character limit.
    // ---------------------------------------------------------

    const price =
      Number(metadata.price) || 0;

    const shipping =
      Number(metadata.shipping) || 0;

    const tax =
      Number(metadata.tax) || 0;

    const total =
      Number(metadata.total) || 0;

    // ---------------------------------------------------------
    // 14. Customer information
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 15. Payment Intent ID
    // ---------------------------------------------------------

    const paymentIntentId =
      typeof session.payment_intent ===
      "string"
        ? session.payment_intent
        : session.payment_intent?.id ||
          null;

    // ---------------------------------------------------------
    // 16. Create PAID Firestore order
    // ---------------------------------------------------------

    const now =
      new Date().toISOString();

    const orderData = {
      user_id: String(userId),

      items: orderItems,

      price,

      shipping,

      tax,

      total,

      fullName,

      phone,

      shippingAddress,

      customerEmail,

      // Order status
      status:
        "Paid / Processing",

      // Payment status
      paymentStatus:
        "paid",

      paymentMethod:
        "Stripe",

      // Stripe references
      stripeSessionId:
        session.id,

      stripePaymentIntentId:
        paymentIntentId,

      // Timestamps
      createdAt: now,

      paidAt: now,
    };

    console.log(
      "Creating Firestore paid order..."
    );

    console.log(
      "Order data:",
      orderData
    );

    // ---------------------------------------------------------
    // 17. Save order to Firestore
    // ---------------------------------------------------------

    const docRef =
      await addDoc(
        ordersRef,
        orderData
      );

    // ---------------------------------------------------------
    // 18. Success
    // ---------------------------------------------------------

    console.log(
      "===================================="
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
      "===================================="
    );

    return NextResponse.json({
      success: true,
      received: true,
      orderId: docRef.id,
    });
  } catch (error: any) {
    console.error(
      "===================================="
    );

    console.error(
      "STRIPE WEBHOOK ERROR:",
      error
    );

    console.error(
      "===================================="
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}