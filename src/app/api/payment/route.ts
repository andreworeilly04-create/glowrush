import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    // =========================================================
    // 1. READ REQUEST BODY
    // =========================================================

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

    // =========================================================
    // 2. CHECK FIREBASE ADMIN CONNECTION
    // =========================================================

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

    // =========================================================
    // 3. VALIDATE USER
    // =========================================================

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

    // =========================================================
    // 4. VALIDATE CART
    // =========================================================

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

    // =========================================================
    // 5. YOUR EXISTING WEBSITE URL
    //
    // DO NOT CHANGE THIS
    // =========================================================

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://glowrush.vercel.app";

    console.log(
      "Base URL:",
      baseUrl
    );

    // =========================================================
    // 6. BUILD STRIPE LINE ITEMS
    // =========================================================

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      [];

    for (const item of items) {
      const itemPrice = Number(item?.price);

      const quantity =
        Number(item?.quantity) || 1;

      // -------------------------------------------------------
      // Validate product price
      // -------------------------------------------------------

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

      // =======================================================
      // PRODUCT IMAGE
      //
      // Your products use imported Next.js images:
      //
      // import glowstick1 from "./01-standard-glow-sticks-6-inch.png";
      //
      // Depending on how the image reaches this route,
      // item.image can be either:
      //
      // "/some-image.png"
      //
      // or an object containing:
      //
      // { src: "/some-image.png", ... }
      //
      // We handle both without hardcoding filenames.
      // =======================================================

      let imagePath: string | undefined;

      if (
        typeof item?.image === "string"
      ) {
        imagePath =
          item.image.trim();
      } else if (
        item?.image &&
        typeof item.image === "object" &&
        typeof item.image.src === "string"
      ) {
        imagePath =
          item.image.src.trim();
      }

      let imageUrl:
        | string
        | undefined;

      if (
        imagePath &&
        imagePath !== ""
      ) {
        try {
          // ---------------------------------------------------
          // If the image is already an absolute URL,
          // use it exactly as provided.
          // ---------------------------------------------------

          if (
            imagePath.startsWith(
              "http://"
            ) ||
            imagePath.startsWith(
              "https://"
            )
          ) {
            imageUrl = imagePath;
          } else {
            // -------------------------------------------------
            // Convert the Next.js image path into an absolute
            // URL that Stripe can access.
            // -------------------------------------------------

            imageUrl = new URL(
              imagePath.startsWith("/")
                ? imagePath
                : `/${imagePath}`,
              baseUrl
            ).toString();
          }

          console.log(
            "--------------------------------------"
          );

          console.log(
            "PRODUCT IMAGE"
          );

          console.log(
            "Product:",
            item?.name
          );

          console.log(
            "Original image:",
            item?.image
          );

          console.log(
            "Image path:",
            imagePath
          );

          console.log(
            "Stripe image URL:",
            imageUrl
          );

          console.log(
            "--------------------------------------"
          );
        } catch (imageError) {
          console.error(
            "Could not create Stripe image URL."
          );

          console.error(
            "Product:",
            item?.name
          );

          console.error(
            "Image:",
            item?.image
          );

          console.error(
            "Error:",
            imageError
          );

          imageUrl =
            undefined;
        }
      } else {
        console.warn(
          "Product has no usable image:",
          item?.name
        );
      }

      // =======================================================
      // STRIPE PRODUCT DATA
      // =======================================================

      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData =
        {
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
        };

      // =======================================================
      // ADD IMAGE TO STRIPE PRODUCT
      // =======================================================

      if (imageUrl) {
        productData.images = [
          imageUrl,
        ];

        console.log(
          "Image successfully added to Stripe product data."
        );
      } else {
        console.warn(
          "No image added to Stripe product:",
          item?.name
        );
      }

      // =======================================================
      // ADD PRODUCT TO STRIPE LINE ITEMS
      // =======================================================

      lineItems.push({
        price_data: {
          currency: "usd",

          product_data:
            productData,

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

    if (
      shippingAmount > 0
    ) {
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

    if (
      taxAmount > 0
    ) {
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
    // =========================================================

    const metadata: Stripe.MetadataParam = {
      user_id:
        String(user_id),

      price:
        Number(
          price || 0
        ).toFixed(2),

      shipping:
        shippingAmount.toFixed(2),

      tax:
        taxAmount.toFixed(2),

      total:
        Number(
          total || 0
        ).toFixed(2),

      fullName:
        String(
          fullName || ""
        ).substring(
          0,
          500
        ),

      phone:
        String(
          phone || ""
        ).substring(
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

    // =========================================================
    // 10. LOG METADATA
    // =========================================================

    console.log(
      "Stripe metadata being sent:"
    );

    console.log(
      metadata
    );

    console.log(
      "Verified user_id:",
      String(user_id)
    );

    // =========================================================
    // 11. LOG FINAL LINE ITEMS
    // =========================================================

    console.log(
      "======================================"
    );

    console.log(
      "STRIPE LINE ITEMS"
    );

    console.log(
      JSON.stringify(
        lineItems,
        null,
        2
      )
    );

    console.log(
      "======================================"
    );

    // =========================================================
    // 12. CREATE STRIPE CHECKOUT SESSION
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
              : undefined,

          metadata,

          // ===================================================
          // KEEPING YOUR ORIGINAL SUCCESS URL
          // ===================================================

          success_url:
            `${baseUrl}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,

          // ===================================================
          // KEEPING YOUR ORIGINAL CANCEL URL
          // ===================================================

          cancel_url:
            `${baseUrl}/checkout?canceled=true`,
        }
      );

    // =========================================================
    // 13. MAKE SURE STRIPE RETURNED A URL
    // =========================================================

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

    // =========================================================
    // 14. SUCCESSFUL SESSION
    // =========================================================

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

    // =========================================================
    // 15. RETURN CHECKOUT URL
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        url:
          session.url,

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
    // =========================================================
    // GLOBAL STRIPE CHECKOUT ERROR
    // =========================================================

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