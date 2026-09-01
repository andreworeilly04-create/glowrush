import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  console.log("======================================");
  console.log("STRIPE WEBHOOK STARTED");
  console.log("======================================");

  try {
    // ---------------------------------------------------------
    // 1. Get the RAW request body
    // ---------------------------------------------------------

    const body = await req.text();

    console.log(
      "Webhook body received:",
      body.length,
      "characters"
    );

    // ---------------------------------------------------------
    // 2. Get Stripe signature
    // ---------------------------------------------------------

    const signature =
      req.headers.get("stripe-signature");

    console.log(
      "Stripe signature exists:",
      !!signature
    );

    if (!signature) {
      console.error(
        "400 ERROR: Missing stripe-signature header."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing stripe-signature header.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. Get webhook secret
    // ---------------------------------------------------------

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_KEY;

    console.log(
      "Webhook secret exists:",
      !!webhookSecret
    );

    if (!webhookSecret) {
      console.error(
        "500 ERROR: STRIPE_WEBHOOK_KEY is missing."
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
        "======================================"
      );

      console.error(
        "400 ERROR: STRIPE SIGNATURE VERIFICATION FAILED"
      );

      console.error(
        error?.message
      );

      console.error(
        "======================================"
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
      "Stripe signature verified successfully."
    );

    console.log(
      "Event ID:",
      event.id
    );

    console.log(
      "Event type:",
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
        "Ignoring event:",
        event.type
      );

      return NextResponse.json({
        success: true,
        received: true,
        ignored: true,
      });
    }

    // ---------------------------------------------------------
    // 6. Get Checkout Session
    // ---------------------------------------------------------

    const session =
      event.data.object as Stripe.Checkout.Session;

    console.log(
      "Checkout Session ID:",
      session.id
    );

    console.log(
      "Payment status:",
      session.payment_status
    );

    // ---------------------------------------------------------
    // 7. Make sure payment is actually paid
    // ---------------------------------------------------------

    if (
      session.payment_status !==
      "paid"
    ) {
      console.log(
        "Payment is not paid."
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
      "======================================"
    );

    console.log(
      "PAYMENT CONFIRMED AS PAID"
    );

    console.log(
      "======================================"
    );

    // ---------------------------------------------------------
    // 8. Read Stripe metadata
    // ---------------------------------------------------------

    const metadata =
      session.metadata || {};

    console.log(
      "======================================"
    );

    console.log(
      "STRIPE METADATA"
    );

    console.log(
      metadata
    );

    console.log(
      "======================================"
    );

    const userId =
      metadata.user_id;

    console.log(
      "user_id from Stripe:",
      userId
    );

    // ---------------------------------------------------------
    // 9. Validate user ID
    // ---------------------------------------------------------

    if (
      !userId ||
      typeof userId !== "string" ||
      userId.trim() === ""
    ) {
      console.error(
        "======================================"
      );

      console.error(
        "400 ERROR: USER ID IS MISSING"
      );

      console.error(
        "The payment route created the Stripe session without a valid user_id."
      );

      console.error(
        "Full metadata:",
        metadata
      );

      console.error(
        "======================================"
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
      "VALID USER ID FOUND:",
      userId
    );

    // ---------------------------------------------------------
    // 10. Get Firebase Admin orders collection
    // ---------------------------------------------------------

    console.log(
      "Connecting to Firebase Admin..."
    );

    const ordersRef =
      adminDb.collection("orders");

    console.log(
      "Firebase Admin orders collection ready."
    );

    // ---------------------------------------------------------
    // 11. Prevent duplicate orders
    // ---------------------------------------------------------

    console.log(
      "Checking for existing order..."
    );

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
        "Order already exists."
      );

      console.log(
        "Existing Firestore ID:",
        existingOrder.id
      );

      return NextResponse.json({
        success: true,
        received: true,
        alreadyExists: true,
        orderId:
          existingOrder.id,
      });
    }

    console.log(
      "No duplicate order found."
    );

    // ---------------------------------------------------------
    // 12. Get Stripe line items
    // ---------------------------------------------------------

    console.log(
      "Getting Stripe line items..."
    );

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
        "======================================"
      );

      console.error(
        "400 ERROR: NO STRIPE LINE ITEMS"
      );

      console.error(
        "Session:",
        session.id
      );

      console.error(
        "======================================"
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
    // 13. Convert Stripe line items
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

          let image = "";

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

            if (
              Array.isArray(
                product.images
              ) &&
              product.images.length > 0
            ) {
              image =
                product.images[0];
            }
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

            image,
          };
        }
      );

    console.log(
      "Order items created:",
      orderItems
    );

    // ---------------------------------------------------------
    // 14. Get metadata totals
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
    // 15. Customer information
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
    // 16. Payment Intent
    // ---------------------------------------------------------

    const paymentIntentId =
      typeof session.payment_intent ===
      "string"
        ? session.payment_intent
        : session.payment_intent?.id ||
          null;

    // ---------------------------------------------------------
    // 17. Create order data
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

      createdAt: now,

      paidAt: now,
    };

    console.log(
      "======================================"
    );

    console.log(
      "CREATING FIREBASE ORDER"
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
      "Payment Status:",
      "paid"
    );

    console.log(
      "======================================"
    );

    // ---------------------------------------------------------
    // 18. Save using Firebase Admin SDK
    // ---------------------------------------------------------

    const docRef =
      await ordersRef.add(
        orderData
      );

    // ---------------------------------------------------------
    // 19. Success
    // ---------------------------------------------------------

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
      "======================================"
    );

    return NextResponse.json({
      success: true,
      received: true,
      orderId: docRef.id,
    });
  } catch (error: any) {
    console.error(
      "======================================"
    );

    console.error(
      "500 ERROR: STRIPE WEBHOOK FAILED"
    );

    console.error(
      "Error:",
      error
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Stack:",
      error?.stack
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