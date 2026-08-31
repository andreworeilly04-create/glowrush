import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const uid = typeof body.uid === "string" ? body.uid.trim() : "";

    const firstName =
      typeof body.firstName === "string" ? body.firstName.trim() : "";

    const lastName =
      typeof body.lastName === "string" ? body.lastName.trim() : "";

    const rawEmail = typeof body.email === "string" ? body.email : "";

    if (!uid || !firstName || !lastName || !rawEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 },
      );
    }

    const email = rawEmail.trim().toLowerCase();

    const usersRef = collection(db, "users");

    // Check whether this Firebase UID already has a profile.
    const userDocRef = doc(db, "users", uid);

    const existingUserQuery = query(usersRef, where("email", "==", email));

    const existingUserSnapshot = await getDocs(existingUserQuery);

    // If the email belongs to a different UID, prevent
    // accidentally overwriting another user's profile.
    if (!existingUserSnapshot.empty) {
      const existingDoc = existingUserSnapshot.docs[0];

      if (existingDoc.id !== uid) {
        return NextResponse.json(
          {
            success: false,
            error: "User already exists",
          },
          { status: 400 },
        );
      }
    }

    // Create/update the Firestore profile using the
    // Firebase Authentication UID as the document ID.
    await setDoc(
      userDocRef,
      {
        firstName,
        lastName,
        email,
        uid,
        updatedAt: new Date().toISOString(),
      },
      {
        merge: true,
      },
    );

    const user = {
      id: uid,
      user_id: uid,
      uid,
      email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
    };

    return NextResponse.json({
      success: true,
      message: "User profile created successfully",
      user,
    });
  } catch (error) {
    console.error("Registration route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
