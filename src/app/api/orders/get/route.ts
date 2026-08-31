
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export async function GET(request: Request) {
  try {
    // Get user_id from the URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    console.log("GET /api/orders/get");
    console.log("Requested user_id:", userId);

    // Make sure a user ID was provided
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing user_id",
          orders: [],
        },
        { status: 400 }
      );
    }

    // Reference the Firestore orders collection
    const ordersRef = collection(db, "orders");

    // Find orders belonging to this user
    const ordersQuery = query(
      ordersRef,
      where("user_id", "==", String(userId))
    );

    // Execute the query
    const querySnapshot = await getDocs(ordersQuery);

    // Convert Firestore documents into normal objects
    const orders = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
      };
    });

    console.log(
      `Found ${orders.length} order(s) for user_id: ${userId}`
    );

    return NextResponse.json(
      {
        success: true,
        orders,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Fetch orders error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || "Failed to fetch orders from Firestore",
        orders: [],
      },
      { status: 500 }
    );
  }
}

