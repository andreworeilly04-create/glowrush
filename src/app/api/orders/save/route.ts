import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
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
    } = body;

    const query = `
        INSERT INTO orders (user_id, items, price, shipping, tax, total, shipping_address, customer_email, phone, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, )
        `;

    await pool.execute(query, [
      user_id || null,
      JSON.stringify(items),
      price || 0,
      shipping || 0,
      tax || 0,
      total || 0,
      shippingAddress || "N/A",
      customerEmail || "N/A",
      phone || "N/A",
      "Paid / Processing",
    ]);

    return NextResponse.json({
      success: true,
      message: "Order successfully saved to MySQL!",
    });
  } catch (error: any) {
    console.error("Database insertion error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
