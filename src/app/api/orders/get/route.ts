import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [userId],
    );

    return NextResponse.json({ success: true, orders: rows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
