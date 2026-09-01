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
    // =========================================================
    // 1. READ RAW STRIPE WEBHOOK BODY
    // =========================================================

    const body = await req.text();

    console.log("======================================");
    console.log("STRIPE WEBHOOK REQUEST RECEIVED");
    console.log("======================================");

    // =========================================================
    // 2. GET STRIPE SIGNATURE
    // =========================================================

    const signature = req.headers.get(
      "stripe-signature"
    );

    if (!signature) {
      console.error(
        "WEBHOOK ERROR: Missing stripe-signature header."
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

    // =========================================================
    // 3. GET WEBHOOK SECRET
    // =========================================================

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_KEY;

    if (!webhookSecret) {
      console.error(
        "WEBHOOK ERROR: STRIPE_WEBHOOK_KEY is missing."
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
    // 4. VERIFY STRIPE WEBHOOK
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
        "WEBHOOK ERROR: Stripe signature verification failed."
      );

      console.error(
        error?.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Stripe webhook signature.",
          details:
            error?.message || "",
        },
        { status: 400 }
      );
    }

    console.log(
      "Stripe event type:",
      event.type
    );

    console.log(
      "Stripe event ID:",
      event.id
    );

    // =========================================================
    // 5. ONLY PROCESS checkout.session.completed
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
        eventType: event.type,
      });
    }

    // =========================================================
    // 6. GET CHECKOUT SESSION
    // =========================================================

    const session =
      event.data.object as Stripe.Checkout.Session;

    console.log(
      "Stripe Checkout Session ID:",
      session.id
    );

    // =========================================================
    // 7. VERIFY PAYMENT STATUS
    // =========================================================

    console.log(
      "Stripe payment status:",
      session.payment_status
    );

    if (
      session.payment_status !==
      "paid"
    ) {
      console.error(
        "Webhook stopped: payment was not paid."
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
    // 8. READ STRIPE METADATA
    // =========================================================

    const metadata =
      session.metadata || {};

    console.log(
      "Stripe metadata received:",
      metadata
    );

    const userId =
      metadata.user_id;

    // =========================================================
    // 9. VERIFY USER ID
    // =========================================================

    if (
      !userId ||
      typeof userId !== "string" ||
      userId.trim() === ""
    ) {
      console.error(
        "WEBHOOK ERROR: Missing user_id in Stripe metadata."
      );

      console.error(
        "Metadata received:",
        metadata
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing user_id in Stripe metadata.",
          metadata,
        },
        { status: 400 }
      );
    }

    console.log(
      "Firebase user ID received from Stripe:",
      userId
    );

    // =========================================================
    // 10. FIRESTORE ORDERS COLLECTION
    // =========================================================

    const ordersRef =
      collection(
        db,
        "orders"
      );

    console.log(
      "Firestore orders collection initialized."
    );

    // =========================================================
    // 11. CHECK FOR DUPLICATE ORDER
    // =========================================================

    console.log(
      "Checking for existing order..."
    );

    const existingOrderQuery =
      query(
        ordersRef,
        where(
          "stripeSessionId",
          "==",
          session.id
        )
      );

    let existingOrders;

    try {
      existingOrders =
        await getDocs(
          existingOrderQuery
        );
    } catch (error: any) {
      console.error(
        "FIRESTORE ERROR: Could not check existing orders."
      );

      console.error(
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Firestore could not query existing orders.",
          details:
            error?.message || "",
        },
        { status: 500 }
      );
    }

    if (
      !existingOrders.empty
    ) {
      console.log(
        "Order already exists."
      );

      console.log(
        "Stripe Session:",
        session.id
      );

      return NextResponse.json({
        success: true,
        received: true,
        alreadyExists: true,
      });
    }

    // =========================================================
    // 12. GET STRIPE LINE ITEMS
    // =========================================================

    console.log(
      "Retrieving Stripe line items..."
    );

    let stripeLineItems;

    try {
      stripeLineItems =
        await stripe.checkout.sessions.listLineItems(
          session.id,
          {
            limit: 100,
            expand: [
              "data.price.product",
            ],
          }
        );
    } catch (error: any) {
      console.error(
        "STRIPE ERROR: Could not retrieve line items."
      );

      console.error(
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not retrieve Stripe line items.",
          details:
            error?.message || "",
        },
        { status: 500 }
      );
    }

    console.log(
      "Stripe line items found:",
      stripeLineItems.data.length
    );

    if (
      stripeLineItems.data.length ===
      0
    ) {
      console.error(
        "WEBHOOK ERROR: Stripe returned zero line items."
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
    // 13. CONVERT STRIPE ITEMS INTO FIRESTORE ITEMS
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

          let description =
            "";

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
            name:
              productName,

            description,

            price:
              unitAmount / 100,

            quantity,

            image:
              "",
          };
        }
      );

    console.log(
      "Converted order items:",
      orderItems
    );

    // =========================================================
    // 14. GET ORDER TOTALS
    // =========================================================

    const price =
      Number(
        metadata.price
      ) || 0;

    const shipping =
      Number(
        metadata.shipping
      ) || 0;

    const tax =
      Number(
        metadata.tax
      ) || 0;

    const total =
      Number(
        metadata.total
      ) || 0;

    console.log(
      "Order totals:",
      {
        price,
        shipping,
        tax,
        total,
      }
    );

    // =========================================================
    // 15. CUSTOMER INFORMATION
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
    // 16. PAYMENT INTENT
    // =========================================================

    const paymentIntentId =
      typeof session.payment_intent ===
      "string"
        ? session.payment_intent
        : session.payment_intent?.id ||
          null;

    // =========================================================
    // 17. CREATE ORDER DATA
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
      "ATTEMPTING FIRESTORE ORDER CREATION"
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
      "Order data:",
      orderData
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 18. SAVE ORDER TO FIRESTORE
    // =========================================================

    let docRef;

    try {
      docRef =
        await addDoc(
          ordersRef,
          orderData
        );
    } catch (error: any) {
      console.error(
        "======================================"
      );

      console.error(
        "FIRESTORE ORDER CREATION FAILED"
      );

      console.error(
        "Firestore error:",
        error
      );

      console.error(
        "Firestore error message:",
        error?.message
      );

      console.error(
        "Firestore error code:",
        error?.code
      );

      console.error(
        "======================================"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to save order to Firestore.",
          details:
            error?.message || "",
          code:
            error?.code || "",
        },
        {
          status: 500,
        }
      );
    }

    // =========================================================
    // 19. SUCCESS
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
      "Firebase User ID:",
      userId
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
      "STRIPE WEBHOOK UNHANDLED ERROR"
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
        code:
          error?.code || "",
      },
      {
        status: 500,
      }
    );
  }
}

