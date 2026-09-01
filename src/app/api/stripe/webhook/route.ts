import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    // =========================================================
    // 1. READ RAW STRIPE WEBHOOK BODY
    // =========================================================

    const body = await req.text();

    // =========================================================
    // 2. GET STRIPE SIGNATURE
    // =========================================================

    const signature =
      req.headers.get("stripe-signature");

    if (!signature) {
      console.error(
        "WEBHOOK ERROR: Missing stripe-signature header."
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
    // 3. GET WEBHOOK SECRET
    // =========================================================

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_KEY;

    if (!webhookSecret) {
      console.error(
        "WEBHOOK ERROR: STRIPE_WEBHOOK_KEY is not configured."
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
        "======================================"
      );

      console.error(
        "STRIPE SIGNATURE VERIFICATION FAILED"
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

    // =========================================================
    // 5. LOG EVENT
    // =========================================================

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
    // 6. ONLY PROCESS CHECKOUT SESSION COMPLETED
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
    // 7. GET CHECKOUT SESSION
    // =========================================================

    const session =
      event.data.object as Stripe.Checkout.Session;

    console.log(
      "Stripe Checkout Session:",
      session.id
    );

    // =========================================================
    // 8. MAKE SURE PAYMENT IS PAID
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
    // 9. GET STRIPE METADATA
    // =========================================================

    const metadata =
      session.metadata || {};

    console.log(
      "Stripe metadata:",
      metadata
    );

    const userId =
      metadata.user_id;

    console.log(
      "User ID from Stripe metadata:",
      userId
    );

    // =========================================================
    // 10. MAKE SURE USER ID EXISTS
    // =========================================================

    if (
      !userId ||
      typeof userId !== "string" ||
      userId.trim() === ""
    ) {
      console.error(
        "======================================"
      );

      console.error(
        "WEBHOOK ERROR: Missing user_id"
      );

      console.error(
        "Stripe metadata:",
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

    // =========================================================
    // 11. FIREBASE ADMIN ORDERS COLLECTION
    // =========================================================

    const ordersRef =
      adminDb.collection("orders");

    // =========================================================
    // 12. PREVENT DUPLICATE ORDERS
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
    // 13. GET STRIPE LINE ITEMS
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
      stripeLineItems.data.length === 0
    ) {
      console.error(
        "WEBHOOK ERROR: No Stripe line items found."
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
    // 14. CONVERT REAL PRODUCTS
    // =========================================================

    const orderItems: any[] = [];

    for (
      const lineItem of stripeLineItems.data
    ) {
      const product =
        lineItem.price?.product;

      // -------------------------------------------------------
      // DEFAULT VALUES
      // -------------------------------------------------------

      let productName =
        "Glow Stick";

      let description =
        "";

      let image =
        "";

      // -------------------------------------------------------
      // GET STRIPE PRODUCT INFORMATION
      // -------------------------------------------------------

      if (
        typeof product === "object" &&
        product !== null &&
        !("deleted" in product)
      ) {
        productName =
          product.name ||
          "Glow Stick";

        description =
          product.description ||
          "";

        // -----------------------------------------------------
        // GET PRODUCT IMAGE FROM STRIPE
        // -----------------------------------------------------

        if (
          Array.isArray(
            product.images
          ) &&
          product.images.length > 0
        ) {
          image =
            product.images[0];

          console.log(
            "✅ IMAGE FOUND IN STRIPE PRODUCT:",
            image
          );
        } else {
          console.warn(
            "⚠️ NO IMAGE FOUND IN STRIPE PRODUCT:",
            productName
          );
        }
      }

      // -------------------------------------------------------
      // IGNORE SHIPPING
      // -------------------------------------------------------

      const normalizedName =
        productName
          .trim()
          .toLowerCase();

      if (
        normalizedName ===
          "shipping" ||
        normalizedName ===
          "estimated tax"
      ) {
        console.log(
          "Ignoring non-product Stripe line item:",
          productName
        );

        continue;
      }

      // -------------------------------------------------------
      // GET PRODUCT PRICE
      // -------------------------------------------------------

      const unitAmount =
        lineItem.price
          ?.unit_amount || 0;

      // -------------------------------------------------------
      // GET QUANTITY
      // -------------------------------------------------------

      const quantity =
        lineItem.quantity || 1;

      // -------------------------------------------------------
      // CREATE ORDER ITEM
      // -------------------------------------------------------

      const orderItem = {
        name:
          productName,

        description:
          description,

        price:
          unitAmount / 100,

        quantity:
          quantity,

        image:
          image,
      };

      console.log(
        "======================================"
      );

      console.log(
        "ADDING PRODUCT TO ORDER"
      );

      console.log(
        "Name:",
        productName
      );

      console.log(
        "Quantity:",
        quantity
      );

      console.log(
        "Price:",
        unitAmount / 100
      );

      console.log(
        "Image:",
        image
      );

      console.log(
        "======================================"
      );

      orderItems.push(
        orderItem
      );
    }

    // =========================================================
    // 15. MAKE SURE REAL PRODUCTS EXIST
    // =========================================================

    if (
      orderItems.length === 0
    ) {
      console.error(
        "WEBHOOK ERROR: No actual products found after filtering."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No actual products found in Stripe order.",
        },
        { status: 400 }
      );
    }

    console.log(
      "======================================"
    );

    console.log(
      "ACTUAL PRODUCTS IN ORDER:"
    );

    console.log(
      orderItems
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 16. GET TOTALS FROM METADATA
    // =========================================================

    const price =
      Number(metadata.price) || 0;

    const shipping =
      Number(metadata.shipping) || 0;

    const tax =
      Number(metadata.tax) || 0;

    const total =
      Number(metadata.total) || 0;

    console.log(
      "Order price:",
      price
    );

    console.log(
      "Order shipping:",
      shipping
    );

    console.log(
      "Order tax:",
      tax
    );

    console.log(
      "Order total:",
      total
    );

    // =========================================================
    // 17. CUSTOMER INFORMATION
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
    // 18. PAYMENT INTENT
    // =========================================================

    const paymentIntentId =
      typeof session.payment_intent ===
      "string"
        ? session.payment_intent
        : session.payment_intent?.id ||
          null;

    // =========================================================
    // 19. CREATE ORDER DATA
    // =========================================================

    const now =
      new Date().toISOString();

    const orderData = {
      user_id:
        String(userId),

      items:
        orderItems,

      price:
        price,

      shipping:
        shipping,

      tax:
        tax,

      total:
        total,

      fullName:
        String(fullName),

      phone:
        String(phone),

      shippingAddress:
        String(shippingAddress),

      customerEmail:
        String(customerEmail),

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

    // =========================================================
    // 20. LOG FINAL ORDER
    // =========================================================

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
      "Products:",
      orderItems
    );

    console.log(
      "Images:",
      orderItems.map(
        (item) => item.image
      )
    );

    console.log(
      "Order data:",
      orderData
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 21. SAVE WITH FIREBASE ADMIN
    // =========================================================

    const docRef =
      await ordersRef.add(
        orderData
      );

    // =========================================================
    // 22. SUCCESS
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
      "Saved Images:",
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
    // =========================================================
    // GLOBAL WEBHOOK ERROR
    // =========================================================

    console.error(
      "======================================"
    );

    console.error(
      "STRIPE WEBHOOK ERROR"
    );

    console.error(
      "Error:",
      error
    );

    console.error(
      "Error message:",
      error?.message
    );

    console.error(
      "Error stack:",
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