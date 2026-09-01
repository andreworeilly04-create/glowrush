
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export async function POST(request: Request) {
  try {
    // ---------------------------------------------------------
    // Read request body
    // ---------------------------------------------------------

    const body = await request.json();

    console.log("======================================");
    console.log("SAVE ORDER ROUTE CALLED");
    console.log("======================================");

    // ---------------------------------------------------------
    // Get order information
    // ---------------------------------------------------------

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
    // Validate user ID
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

    // ---------------------------------------------------------
    // IMPORTANT:
    //
    // Orders must only be saved after successful payment.
    // ---------------------------------------------------------

    if (paymentStatus !== "paid") {
      console.error(
        "Save order rejected because paymentStatus is not paid:",
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
    // Validate Stripe session ID
    //
    // The webhook should provide this.
    // ---------------------------------------------------------

    if (!stripeSessionId) {
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
    // Safely prepare order items
    // ---------------------------------------------------------

    let orderItems: any[] = [];

    if (Array.isArray(items)) {
      orderItems = items;
    } else if (
      typeof items === "string" &&
      items !== "undefined" &&
      items.trim() !== ""
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

    // ---------------------------------------------------------
    // Make sure there are actual products
    // ---------------------------------------------------------

    if (orderItems.length === 0) {
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
    // Get Firestore orders collection
    // ---------------------------------------------------------

    const ordersRef =
      collection(db, "orders");

    // ---------------------------------------------------------
    // Prevent duplicate Stripe orders
    // ---------------------------------------------------------

    const existingOrderQuery =
      query(
        ordersRef,
        where(
          "stripeSessionId",
          "==",
          String(stripeSessionId)
        )
      );

    const existingOrders =
      await getDocs(
        existingOrderQuery
      );

    if (!existingOrders.empty) {
      const existingOrder =
        existingOrders.docs[0];

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
        message:
          "Order already exists.",
      });
    }

    // ---------------------------------------------------------
    // Prepare Firestore order
    // ---------------------------------------------------------

    const orderData = {
      // User
      user_id: String(user_id),

      // Products
      items: orderItems,

      // Prices
      price: Number(price) || 0,
      shipping: Number(shipping) || 0,
      tax: Number(tax) || 0,
      total: Number(total) || 0,

      // Customer
      fullName: fullName || "",
      phone: phone || "",
      shippingAddress:
        shippingAddress || "",
      customerEmail:
        customerEmail || "",

      // Order status
      status:
        status || "Paid / Processing",

      // Payment status
      paymentStatus:
        "paid",

      paymentMethod:
        paymentMethod || "Stripe",

      // Stripe information
      stripeSessionId:
        String(stripeSessionId),

      stripePaymentIntentId:
        stripePaymentIntentId || null,

      // Timestamps
      createdAt:
        new Date().toISOString(),

      paidAt:
        paidAt ||
        new Date().toISOString(),
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
    // Save to Firestore
    // ---------------------------------------------------------

    const docRef =
      await addDoc(
        ordersRef,
        orderData
      );

    // ---------------------------------------------------------
    // Success
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

