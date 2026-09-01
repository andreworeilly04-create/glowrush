import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // ---------------------------------------------------------
    // 1. Read request body
    // ---------------------------------------------------------

    const body = await request.json();

    console.log("======================================");
    console.log("SAVE ORDER ROUTE CALLED");
    console.log("======================================");

    const {
      user_id,
      items,
      price,
      shipping,
      tax,
      total,
      fullName,
      phone,
      shippingAddress,
      customerEmail,
      status,
      paymentStatus,
      paymentMethod,
      stripeSessionId,
      stripePaymentIntentId,
      paidAt,
    } = body;

    console.log("user_id:", user_id);
    console.log("stripeSessionId:", stripeSessionId);
    console.log("paymentStatus:", paymentStatus);

    // ---------------------------------------------------------
    // 2. Validate user ID
    // ---------------------------------------------------------

    if (
      !user_id ||
      typeof user_id !== "string" ||
      user_id.trim() === ""
    ) {
      console.error("Missing user_id.");

      return NextResponse.json(
        {
          success: false,
          error: "Missing user_id.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. Validate Stripe session
    // ---------------------------------------------------------

    if (
      !stripeSessionId ||
      typeof stripeSessionId !== "string"
    ) {
      console.error(
        "Missing Stripe Checkout Session ID."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Stripe Checkout Session ID.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4. Validate payment
    // ---------------------------------------------------------

    if (paymentStatus !== "paid") {
      console.error(
        "Order rejected because paymentStatus is not paid:",
        paymentStatus
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Order cannot be saved because payment has not been confirmed.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 5. Validate items
    // ---------------------------------------------------------

    let orderItems: any[] = [];

    if (Array.isArray(items)) {
      orderItems = items;
    } else if (
      typeof items === "string" &&
      items.trim() !== "" &&
      items !== "undefined"
    ) {
      try {
        const parsedItems = JSON.parse(items);

        if (Array.isArray(parsedItems)) {
          orderItems = parsedItems;
        }
      } catch (error) {
        console.error(
          "Failed to parse order items:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid order items format.",
          },
          { status: 400 }
        );
      }
    }

    if (orderItems.length === 0) {
      console.error(
        "Cannot save order without items."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot save an order without items.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 6. Use Firebase Admin Firestore
    // ---------------------------------------------------------

    const ordersRef = adminDb.collection("orders");

    console.log(
      "Using Firebase Admin Firestore."
    );

    // ---------------------------------------------------------
    // 7. Prevent duplicate Stripe orders
    // ---------------------------------------------------------

    const existingOrdersSnapshot =
      await ordersRef
        .where(
          "stripeSessionId",
          "==",
          String(stripeSessionId)
        )
        .limit(1)
        .get();

    if (!existingOrdersSnapshot.empty) {
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
        stripeSessionId
      );

      console.log(
        "======================================"
      );

      return NextResponse.json({
        success: true,
        alreadyExists: true,
        orderId: existingOrder.id,
        message: "Order already exists.",
      });
    }

    // ---------------------------------------------------------
    // 8. Prepare Firestore order
    // ---------------------------------------------------------

    const now =
      new Date().toISOString();

    const orderData = {
      user_id: String(user_id),

      items: orderItems,

      price: Number(price) || 0,

      shipping:
        Number(shipping) || 0,

      tax:
        Number(tax) || 0,

      total:
        Number(total) || 0,

      fullName:
        typeof fullName === "string"
          ? fullName
          : "",

      phone:
        typeof phone === "string"
          ? phone
          : "",

      shippingAddress:
        typeof shippingAddress === "string"
          ? shippingAddress
          : "",

      customerEmail:
        typeof customerEmail === "string"
          ? customerEmail
          : "",

      status:
        typeof status === "string" &&
        status.trim() !== ""
          ? status
          : "Paid / Processing",

      paymentStatus: "paid",

      paymentMethod:
        typeof paymentMethod === "string" &&
        paymentMethod.trim() !== ""
          ? paymentMethod
          : "Stripe",

      stripeSessionId:
        String(stripeSessionId),

      stripePaymentIntentId:
        stripePaymentIntentId
          ? String(stripePaymentIntentId)
          : null,

      createdAt: now,

      paidAt:
        paidAt ||
        now,
    };

    console.log(
      "======================================"
    );

    console.log(
      "CREATING PAID FIRESTORE ORDER"
    );

    console.log(
      "Order data:",
      orderData
    );

    console.log(
      "======================================"
    );

    // ---------------------------------------------------------
    // 9. Save using Firebase Admin
    // ---------------------------------------------------------

    const docRef =
      await ordersRef.add(orderData);

    // ---------------------------------------------------------
    // 10. Success
    // ---------------------------------------------------------

    console.log(
      "======================================"
    );

    console.log(
      "PAID ORDER SAVED SUCCESSFULLY"
    );

    console.log(
      "Firestore Order ID:",
      docRef.id
    );

    console.log(
      "Stripe Session ID:",
      stripeSessionId
    );

    console.log(
      "User ID:",
      user_id
    );

    console.log(
      "======================================"
    );

    return NextResponse.json(
      {
        success: true,
        orderId: docRef.id,
        message:
          "Paid order saved successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "======================================"
    );

    console.error(
      "SAVE ORDER ERROR:",
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
          "Failed to save order.",
      },
      { status: 500 }
    );
  }
}