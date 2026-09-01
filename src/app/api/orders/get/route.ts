import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    console.log("======================================");
    console.log("GET /api/orders/get");
    console.log("======================================");

    // Get user_id from URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    console.log("Requested user_id:", userId);

    // Validate user ID
    if (
      !userId ||
      typeof userId !== "string" ||
      userId.trim() === ""
    ) {
      console.error(
        "GET ORDERS ERROR: Missing user_id"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Missing user_id",
          orders: [],
        },
        { status: 400 }
      );
    }

    const cleanUserId = userId.trim();

    console.log(
      "Looking for orders belonging to:",
      cleanUserId
    );

    // ---------------------------------------------------------
    // Firebase Admin Firestore
    // ---------------------------------------------------------

    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("user_id", "==", cleanUserId)
      .get();

    console.log(
      "Firestore documents found:",
      ordersSnapshot.size
    );

    // ---------------------------------------------------------
    // Convert Firestore documents
    // ---------------------------------------------------------

    const orders = ordersSnapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    console.log(
      `Found ${orders.length} order(s) for user_id: ${cleanUserId}`
    );

    console.log("======================================");
    console.log("GET ORDERS SUCCESS");
    console.log("======================================");

    return NextResponse.json(
      {
        success: true,
        orders,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("======================================");
    console.error("GET ORDERS FIREBASE ERROR");
    console.error(error);
    console.error("======================================");

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to fetch orders from Firestore",
        orders: [],
      },
      { status: 500 }
    );
  }
}