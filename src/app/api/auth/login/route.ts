import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collection, query, where, getDocs } from "firebase/firestore";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = body.email;
    const password = body.password;

    if (!rawEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`Login failed: No user found for email -> ${normalizedEmail}`);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Check common password field keys used during registration
    const storedPasswordHash = userData.password || userData.passwordHash || userData.hashedPassword;

    if (!storedPasswordHash) {
      console.error(`Login error: User document ${userId} is missing a password hash field.`);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, storedPasswordHash);

    if (!passwordMatch) {
      console.log(`Login failed: Password mismatch for user -> ${normalizedEmail}`);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const user = {
      id: userId,
      user_id: userId,
      uid: userId,
      _id: userId,
      email: userData.email || normalizedEmail,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
    };

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: user,
    });

    response.cookies.set({
      name: "session",
      value: userId,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return response;
  } catch (error) {
    console.error("Critical login route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}