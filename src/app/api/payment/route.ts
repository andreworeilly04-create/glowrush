import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. Read request body
    // ---------------------------------------------------------

    const body = await req.json();

    const {
      items,
      shipping,
      tax,
      user_id,
      price,
      total,
      fullName,
      phone,
      shippingAddress,
      customerEmail,
    } = body;

    console.log("======================================");
    console.log("STARTING STRIPE CHECKOUT");
    console.log("======================================");

    console.log("User ID:", user_id);
    console.log("Items:", items);

    // ---------------------------------------------------------
    // 2. Check Firebase Admin connection
    // ---------------------------------------------------------

    if (!adminDb) {
      console.error(
        "Firebase Admin database is not available."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Firebase Admin database is not available.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "Firebase Admin database initialized."
    );

    // ---------------------------------------------------------
    // 3. Validate user
    // ---------------------------------------------------------

    if (
      !user_id ||
      typeof user_id !== "string" ||
      user_id.trim() === ""
    ) {
      console.error(
        "Stripe checkout error: Missing user_id."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Missing user_id.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // 4. Validate cart
    // ---------------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      console.error(
        "Stripe checkout error: Cart is empty."
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

    // ---------------------------------------------------------
    // 5. Build Stripe line items
    // ---------------------------------------------------------

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      [];

    for (const item of items) {
      const itemPrice = Number(item?.price);

      const quantity =
        Number(item?.quantity) || 1;

      if (
        !Number.isFinite(itemPrice) ||
        itemPrice < 0
      ) {
        console.error(
          "Invalid product price:",
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

      // -------------------------------------------------------
      // Product image
      // -------------------------------------------------------

      let productImage:
        | string
        | undefined;

      if (
        typeof item?.image === "string" &&
        item.image.trim() !== ""
      ) {
        productImage =
          item.image.trim();
      } else if (
        typeof item?.image === "object" &&
        item.image !== null &&
        typeof item.image.src === "string" &&
        item.image.src.trim() !== ""
      ) {
        productImage =
          item.image.src.trim();
      }

      console.log(
        "Product:",
        item?.name
      );

      console.log(
        "Product image:",
        productImage
      );

      // -------------------------------------------------------
      // Product data
      // -------------------------------------------------------

      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData =
        {
          name:
            typeof item?.name === "string" &&
            item.name.trim() !== ""
              ? item.name
              : "Glow Stick",

          description:
            typeof item?.description === "string"
              ? item.description
              : "",
        };

      // -------------------------------------------------------
      // Add image if available
      // -------------------------------------------------------

      if (productImage) {
        productData.images = [
          productImage,
        ];

        console.log(
          "Product image added to Stripe:",
          productImage
        );
      } else {
        console.warn(
          "No product image found for:",
          item?.name
        );
      }

      lineItems.push({
        price_data: {
          currency: "usd",

          product_data:
            productData,

          unit_amount:
            Math.round(itemPrice * 100),
        },

        quantity,
      });
    }

    // ---------------------------------------------------------
    // 6. Add shipping
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 7. Add tax
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 8. Prepare Stripe metadata
    // ---------------------------------------------------------

    const metadata: Stripe.MetadataParam = {
      user_id: String(user_id),

      price:
        Number(price || 0).toFixed(2),

      shipping:
        shippingAmount.toFixed(2),

      tax:
        taxAmount.toFixed(2),

      total:
        Number(total || 0).toFixed(2),

      fullName:
        String(fullName || "").substring(
          0,
          500
        ),

      phone:
        String(phone || "").substring(
          0,
          500
        ),

      shippingAddress:
        String(
          shippingAddress || ""
        ).substring(
          0,
          500
        ),

      customerEmail:
        String(
          customerEmail || ""
        ).substring(
          0,
          500
        ),
    };

    // ---------------------------------------------------------
    // 9. Log metadata
    // ---------------------------------------------------------

    console.log(
      "Stripe metadata being sent:"
    );

    console.log(metadata);

    console.log(
      "Verified user_id:",
      String(user_id)
    );

    // ---------------------------------------------------------
    // 10. Website URL
    // ---------------------------------------------------------

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://glowrush.vercel.app";

    console.log(
      "Base URL:",
      baseUrl
    );

    // ---------------------------------------------------------
    // 11. Create Stripe Checkout Session
    // ---------------------------------------------------------

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
              : undefined,

          metadata,

          success_url:
            `${baseUrl}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${baseUrl}/checkout?canceled=true`,
        }
      );

    // ---------------------------------------------------------
    // 12. Make sure Stripe returned a URL
    // ---------------------------------------------------------

    if (!session.url) {
      console.error(
        "Stripe did not return a checkout URL."
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

    // ---------------------------------------------------------
    // 13. Successful session
    // ---------------------------------------------------------

    console.log(
      "======================================"
    );

    console.log(
      "STRIPE CHECKOUT SESSION CREATED"
    );

    console.log(
      "Session ID:",
      session.id
    );

    console.log(
      "User ID:",
      user_id
    );

    console.log(
      "Checkout URL:",
      session.url
    );

    console.log(
      "======================================"
    );

    // ---------------------------------------------------------
    // 14. Return checkout URL
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        url: session.url,

        sessionId:
          session.id,

        user_id:
          String(user_id),
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    // ---------------------------------------------------------
    // Stripe checkout error
    // ---------------------------------------------------------

    console.error(
      "======================================"
    );

    console.error(
      "STRIPE CHECKOUT ERROR"
    );

    console.error(
      "Error message:",
      error?.message
    );

    console.error(
      "Full error:",
      error
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