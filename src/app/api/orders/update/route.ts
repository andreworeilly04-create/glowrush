import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { id, status } = body;

    // Validate order ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing order ID",
        },
        { status: 400 }
      );
    }

    // Validate status
    if (!status || typeof status !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid status",
        },
        { status: 400 }
      );
    }

    // Only allow valid order statuses
    const allowedStatuses = [
      "Paid / Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Allowed statuses: ${allowedStatuses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Update the order in MySQL
    const [result]: any = await pool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    // Make sure the order actually exists
    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId: id,
      status: status,
    });
  } catch (error: any) {
    console.error("Update order error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update order status",
      },
      { status: 500 }
    );
  }
}

