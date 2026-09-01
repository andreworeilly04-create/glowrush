import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ---------------------------------------------------------
// Firebase Admin SDK
// SERVER-ONLY FILE
//
// Required environment variables:
//
// FIREBASE_PROJECT_ID
// FIREBASE_CLIENT_EMAIL
// FIREBASE_PRIVATE_KEY
// ---------------------------------------------------------

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  throw new Error(
    "Missing FIREBASE_PROJECT_ID environment variable."
  );
}

if (!clientEmail) {
  throw new Error(
    "Missing FIREBASE_CLIENT_EMAIL environment variable."
  );
}

if (!privateKey) {
  throw new Error(
    "Missing FIREBASE_PRIVATE_KEY environment variable."
  );
}

// ---------------------------------------------------------
// Initialize Firebase Admin only once
// ---------------------------------------------------------

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });

// ---------------------------------------------------------
// Export Admin Firestore
// ---------------------------------------------------------

export const adminDb = getFirestore(adminApp);

