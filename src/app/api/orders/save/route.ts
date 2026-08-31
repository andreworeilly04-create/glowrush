import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  collection,
  addDoc,
} from "firebase/firestore";

export async function POST(request: Request) {
  try {
    // Read request body
    const body = await request.json();

    const {
      user_id,
      items,
      price,
      shipping,
      tax,
      total,
      phone,
      shippingAddress,
      customerEmail,
      status,
    } = body;

    console.log("Saving order...");
    console.log("user_id:", user_id);
    console.log("items:", items);

    // ---------------------------------------------------------
    // Validate user ID
    // ---------------------------------------------------------
    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing user_id",
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
        console.error("Failed to parse order items:", error);

        return NextResponse.json(
          {
            success: false,
            error: "Invalid order items format",
          },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------
    // Prepare order data
    // ---------------------------------------------------------
    const orderData = {
      user_id: String(user_id),

      items: orderItems,

      price: Number(price) || 0,

      shipping: Number(shipping) || 0,

      tax: Number(tax) || 0,

      total: Number(total) || 0,

      phone: phone || "N/A",

      shippingAddress:
        shippingAddress || "N/A",

      customerEmail:
        customerEmail || "N/A",

      // Default status
      status: status || "Paid / Processing",

      // ISO timestamp makes it easy to read and sort
      createdAt: new Date().toISOString(),
    };

    console.log("Order data being saved:", orderData);

    // ---------------------------------------------------------
    // Save to Firestore
    // ---------------------------------------------------------
    const ordersRef = collection(db, "orders");

    const docRef = await addDoc(
      ordersRef,
      orderData
    );

    console.log(
      "Order successfully saved with ID:",
      docRef.id
    );

    // ---------------------------------------------------------
    // Return successful response
    // ---------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        orderId: docRef.id,
        message: "Order saved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "Save order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to save order",
      },
      { status: 500 }
    );
  }
}

