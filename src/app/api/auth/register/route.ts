import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, confirmPassword } =
      await request.json();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "Missing required fields " },
        { status: 400 },
      );
    }

    const [existingRows]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (existingRows.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match " },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result]: any = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
      [firstName, lastName, email, hashedPassword],
    );

    const userId = result.insertId;

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          user_id: userId,
          email: email,
        },
      },
      { status: 201 },
    );

    response.cookies.set({
      name: "session",
      value: email,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" });
  }
}
