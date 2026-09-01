import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("======================================");
    console.log("STARTING STRIPE PAYMENT ROUTE");
    console.log("======================================");

    // =========================================================
    // 1. GET AUTHORIZATION HEADER
    // =========================================================

    const authorization =
      req.headers.get("authorization");

    if (!authorization) {
      console.error(
        "PAYMENT ERROR: Missing Authorization header."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Missing Authorization header.",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // 2. EXTRACT FIREBASE TOKEN
    // =========================================================

    const token =
      authorization.startsWith("Bearer ")
        ? authorization.substring(7)
        : null;

    if (!token) {
      console.error(
        "PAYMENT ERROR: Invalid Authorization header."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid Authorization header.",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // 3. VERIFY FIREBASE USER
    // =========================================================

    let decodedToken;

    try {
      decodedToken =
        await getAuth().verifyIdToken(token);
    } catch (error: any) {
      console.error(
        "FIREBASE TOKEN VERIFICATION FAILED:"
      );

      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired Firebase authentication token.",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      decodedToken.uid;

    if (!userId) {
      console.error(
        "PAYMENT ERROR: Firebase token did not contain a UID."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to determine Firebase user ID.",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "FIREBASE USER VERIFIED"
    );

    console.log(
      "Firebase UID:",
      userId
    );

    // =========================================================
    // 4. READ REQUEST BODY
    // =========================================================

    const body =
      await req.json();

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
      "Items received:",
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
          error: "No items were provided.",
        },
        {
          status: 400,
        }
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

      if (
        !Number.isFinite(itemPrice) ||
        itemPrice < 0
      ) {
        console.error(
          "PAYMENT ERROR: Invalid product price:",
          item
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "One of the products has an invalid price.",
          },
          {
            status: 400,
          }
        );
      }

      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name:
              typeof item?.name === "string" &&
              item.name.trim() !== ""
                ? item.name
                : "Glow Stick",

            description:
              typeof item?.description === "string"
                ? item.description
                : "",
          },

          unit_amount:
            Math.round(itemPrice * 100),
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
    // 9. CREATE STRIPE METADATA
    // =========================================================

    const metadata: Stripe.MetadataParam = {
      user_id: userId,

      price:
        Number(price || 0)
          .toFixed(2),

      shipping:
        shippingAmount
          .toFixed(2),

      tax:
        taxAmount
          .toFixed(2),

      total:
        Number(total || 0)
          .toFixed(2),

      fullName:
        String(fullName || "")
          .substring(0, 500),

      phone:
        String(phone || "")
          .substring(0, 500),

      shippingAddress:
        String(shippingAddress || "")
          .substring(0, 500),

      customerEmail:
        String(customerEmail || "")
          .substring(0, 500),
    };

    console.log(
      "STRIPE METADATA:"
    );

    console.log(
      metadata
    );

    // =========================================================
    // 10. GET WEBSITE URL
    // =========================================================

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://glowrush.vercel.app";

    // =========================================================
    // 11. CREATE STRIPE CHECKOUT SESSION
    // =========================================================

    console.log(
      "CREATING STRIPE CHECKOUT SESSION..."
    );

    const session =
      await stripe.checkout.sessions.create({
        payment_method_types: [
          "card",
        ],

        mode: "payment",

        line_items:
          lineItems,

        customer_email:
          typeof customerEmail === "string" &&
          customerEmail.trim() !== ""
            ? customerEmail
            : undefined,

        metadata,

        success_url:
          `${baseUrl}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${baseUrl}/checkout?canceled=true`,
      });

    // =========================================================
    // 12. MAKE SURE STRIPE RETURNED URL
    // =========================================================

    if (!session.url) {
      console.error(
        "PAYMENT ERROR: Stripe did not return a checkout URL."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Stripe did not return a checkout URL.",
        },
        {
          status: 500,
        }
      );
    }

    console.log("======================================");
    console.log(
      "STRIPE CHECKOUT SESSION CREATED"
    );
    console.log(
      "Session ID:",
      session.id
    );
    console.log(
      "Firebase User ID:",
      userId
    );
    console.log("======================================");

    // =========================================================
    // 13. RETURN STRIPE URL
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        url:
          session.url,

        sessionId:
          session.id,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("======================================");
    console.error(
      "PAYMENT ROUTE ERROR"
    );
    console.error(error);
    console.error("======================================");

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