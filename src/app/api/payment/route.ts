import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("======================================");
    console.log("PAYMENT ROUTE STARTED");
    console.log("======================================");

    // =========================================================
    // 1. GET FIREBASE ID TOKEN FROM AUTHORIZATION HEADER
    // =========================================================

    const authorization =
      req.headers.get("authorization");

    console.log(
      "Authorization header exists:",
      !!authorization
    );

    if (!authorization) {
      console.error(
        "PAYMENT ERROR: Missing Authorization header."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required. Missing Authorization header.",
        },
        { status: 401 }
      );
    }

    // Expected:
    // Authorization: Bearer FIREBASE_ID_TOKEN

    if (
      !authorization
        .toLowerCase()
        .startsWith("bearer ")
    ) {
      console.error(
        "PAYMENT ERROR: Authorization header is not Bearer format."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Authorization header format.",
        },
        { status: 401 }
      );
    }

    const idToken =
      authorization.substring(7).trim();

    if (!idToken) {
      console.error(
        "PAYMENT ERROR: Firebase ID token is empty."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Firebase ID token.",
        },
        { status: 401 }
      );
    }

    // =========================================================
    // 2. VERIFY FIREBASE ID TOKEN WITH ADMIN SDK
    // =========================================================

    let decodedToken;

    try {
      console.log(
        "Verifying Firebase ID token..."
      );

      decodedToken =
        await getAuth().verifyIdToken(
          idToken
        );

      console.log(
        "Firebase ID token verified successfully."
      );

      console.log(
        "Verified Firebase UID:",
        decodedToken.uid
      );

      console.log(
        "Verified Firebase email:",
        decodedToken.email || "No email"
      );
    } catch (error: any) {
      console.error(
        "======================================"
      );

      console.error(
        "FIREBASE TOKEN VERIFICATION FAILED"
      );

      console.error(
        "Error:",
        error
      );

      console.error(
        "Error message:",
        error?.message
      );

      console.error(
        "Error code:",
        error?.code
      );

      console.error(
        "======================================"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired Firebase authentication token.",
        },
        { status: 401 }
      );
    }

    // =========================================================
    // 3. GET THE REAL USER ID
    //
    // IMPORTANT:
    // We get this from the verified Firebase token.
    //
    // We DO NOT trust user_id sent in the request body.
    // =========================================================

    const userId =
      decodedToken.uid;

    if (
      !userId ||
      typeof userId !== "string" ||
      userId.trim() === ""
    ) {
      console.error(
        "PAYMENT ERROR: Firebase token did not contain a UID."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Authenticated Firebase user does not have a valid UID.",
        },
        { status: 401 }
      );
    }

    console.log(
      "AUTHENTICATED USER ID:",
      userId
    );

    // =========================================================
    // 4. READ REQUEST BODY
    // =========================================================

    const body = await req.json();

    console.log(
      "Payment request body received."
    );

    const {
      items,
      shipping,
      tax,
      price,
      total,
      fullName,
      phone,
      shippingAddress,
      customerEmail,
    } = body;

    console.log(
      "User ID from verified Firebase token:",
      userId
    );

    console.log(
      "User ID supplied by frontend:",
      body?.user_id || "NOT PROVIDED"
    );

    console.log(
      "Items:",
      items
    );

    // =========================================================
    // 5. VALIDATE CART
    // =========================================================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      console.error(
        "PAYMENT ERROR: Cart is empty."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No items were provided.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 6. BUILD STRIPE LINE ITEMS
    // =========================================================

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      [];

    for (const item of items) {
      const itemPrice =
        Number(item?.price);

      const quantity =
        Number(item?.quantity) || 1;

      console.log(
        "Processing cart item:",
        {
          name: item?.name,
          price: itemPrice,
          quantity,
        }
      );

      if (
        !Number.isFinite(itemPrice) ||
        itemPrice < 0
      ) {
        console.error(
          "PAYMENT ERROR: Invalid product price.",
          item
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "One of the products has an invalid price.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        console.error(
          "PAYMENT ERROR: Invalid product quantity.",
          item
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "One of the products has an invalid quantity.",
          },
          { status: 400 }
        );
      }

      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name:
              typeof item?.name ===
                "string" &&
              item.name.trim() !== ""
                ? item.name
                : "Glow Stick",

            description:
              typeof item?.description ===
                "string"
                ? item.description
                : "",

            // Stripe product images must be publicly
            // accessible URLs.
            ...(typeof item?.image ===
              "string" &&
            item.image.startsWith("http")
              ? {
                  images: [
                    item.image,
                  ],
                }
              : {}),
          },

          unit_amount:
            Math.round(
              itemPrice * 100
            ),
        },

        quantity,
      });
    }

    // =========================================================
    // 7. ADD SHIPPING
    // =========================================================

    const shippingAmount =
      Number(shipping) || 0;

    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Shipping",
          },

          unit_amount:
            Math.round(
              shippingAmount * 100
            ),
        },

        quantity: 1,
      });
    }

    // =========================================================
    // 8. ADD TAX
    // =========================================================

    const taxAmount =
      Number(tax) || 0;

    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Estimated Tax",
          },

          unit_amount:
            Math.round(
              taxAmount * 100
            ),
        },

        quantity: 1,
      });
    }

    // =========================================================
    // 9. PREPARE STRIPE METADATA
    //
    // user_id comes from Firebase Admin verification.
    // =========================================================

    const metadata: Stripe.MetadataParam = {
      user_id: String(userId),

      price:
        Number(price || 0).toFixed(2),

      shipping:
        shippingAmount.toFixed(2),

      tax:
        taxAmount.toFixed(2),

      total:
        Number(total || 0).toFixed(2),

      fullName:
        String(
          fullName || ""
        ).substring(0, 500),

      phone:
        String(
          phone || ""
        ).substring(0, 500),

      shippingAddress:
        String(
          shippingAddress || ""
        ).substring(0, 500),

      customerEmail:
        String(
          customerEmail ||
            decodedToken.email ||
            ""
        ).substring(0, 500),
    };

    console.log(
      "======================================"
    );

    console.log(
      "STRIPE METADATA"
    );

    console.log(
      metadata
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 10. WEBSITE URL
    // =========================================================

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://glowrush.vercel.app";

    console.log(
      "Base URL:",
      baseUrl
    );

    // =========================================================
    // 11. CREATE STRIPE CHECKOUT SESSION
    // =========================================================

    console.log(
      "Creating Stripe Checkout Session..."
    );

    const session =
      await stripe.checkout.sessions.create(
        {
          payment_method_types: [
            "card",
          ],

          mode: "payment",

          line_items:
            lineItems,

          customer_email:
            typeof customerEmail ===
              "string" &&
            customerEmail.trim() !== ""
              ? customerEmail
              : decodedToken.email ||
                undefined,

          metadata,

          success_url:
            `${baseUrl}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${baseUrl}/checkout?canceled=true`,
        }
      );

    // =========================================================
    // 12. VERIFY STRIPE RETURNED URL
    // =========================================================

    if (!session.url) {
      console.error(
        "STRIPE ERROR: No checkout URL returned."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Stripe did not return a checkout URL.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 13. SUCCESS LOGGING
    // =========================================================

    console.log(
      "======================================"
    );

    console.log(
      "STRIPE CHECKOUT SESSION CREATED"
    );

    console.log(
      "Stripe Session ID:",
      session.id
    );

    console.log(
      "Verified Firebase User ID:",
      userId
    );

    console.log(
      "Stripe Metadata user_id:",
      metadata.user_id
    );

    console.log(
      "Checkout URL:",
      session.url
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 14. RETURN TO FRONTEND
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        url: session.url,

        sessionId:
          session.id,

        // This lets us verify from the browser
        // that the server used the correct UID.
        user_id: userId,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "======================================"
    );

    console.error(
      "STRIPE CHECKOUT ERROR"
    );

    console.error(
      "Error:",
      error
    );

    console.error(
      "Error message:",
      error?.message
    );

    console.error(
      "Error type:",
      error?.type
    );

    console.error(
      "Error code:",
      error?.code
    );

    console.error(
      "======================================"
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to create Stripe checkout session.",
      },
      {
        status: 500,
      }
    );
  }
}