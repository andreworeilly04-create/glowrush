"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./page.orders.module.css";
import Link from "next/link";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/db";

type Order = {
  id: string;
  name: string;
  image: string;
  status: string;
  paymentStatus: string;
  price: string;
  shipping: string;
  tax: string;
  total: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] =
    useState<string | null>(null);

  // =========================================================
  // GET IMAGE URL
  // =========================================================

  const getImageUrl = (image: any): string => {
    if (!image) {
      return "";
    }

    // -------------------------------------------------------
    // Already a normal string
    // -------------------------------------------------------

    if (typeof image === "string") {
      return image.trim();
    }

    // -------------------------------------------------------
    // Next.js imported image object
    // -------------------------------------------------------

    if (
      typeof image === "object" &&
      image !== null
    ) {
      if (
        typeof image.src === "string" &&
        image.src.trim() !== ""
      ) {
        return image.src.trim();
      }

      // Some Next.js image objects can contain this
      if (
        typeof image.default?.src === "string" &&
        image.default.src.trim() !== ""
      ) {
        return image.default.src.trim();
      }

      // Fallback if image itself contains a URL
      if (
        typeof image.url === "string" &&
        image.url.trim() !== ""
      ) {
        return image.url.trim();
      }

      if (
        typeof image.default?.url === "string" &&
        image.default.url.trim() !== ""
      ) {
        return image.default.url.trim();
      }
    }

    return "";
  };

  // =========================================================
  // FORMAT ORDERS
  // =========================================================

  const formatOrders = (
    databaseOrders: any[]
  ): Order[] => {
    console.log(
      "======================================"
    );

    console.log(
      "🔎 ORDERS DEBUG: formatOrders received"
    );

    console.log(
      "Number of database orders:",
      databaseOrders.length
    );

    console.log(
      "======================================"
    );

    return databaseOrders.map((order: any) => {
      let items: any[] = [];

      // -------------------------------------------------------
      // Parse items
      // -------------------------------------------------------

      try {
        if (Array.isArray(order.items)) {
          items = order.items;
        } else if (
          typeof order.items === "string" &&
          order.items.trim() !== ""
        ) {
          const parsed = JSON.parse(order.items);

          if (Array.isArray(parsed)) {
            items = parsed;
          }
        }
      } catch (error) {
        console.error(
          "❌ Orders - failed to parse items:",
          error
        );
      }

      console.log(
        "📦 Raw order items:",
        items
      );

      const firstItem =
        items.length > 0
          ? items[0]
          : null;

      // -------------------------------------------------------
      // Product names + quantities
      // -------------------------------------------------------

      const name =
        items.length > 0
          ? items
              .map(
                (item: any) =>
                  `${item?.name || "Item"} (Quantity: ${
                    Number(item?.quantity) || 1
                  })`
              )
              .join(", ")
          : "GlowRush Order";

      // -------------------------------------------------------
      // PRODUCT IMAGE
      // -------------------------------------------------------

      let image = "";

      if (firstItem?.image) {
        image = getImageUrl(
          firstItem.image
        );
      }

      // -------------------------------------------------------
      // Additional fallback:
      // Some order structures may have the image directly
      // on the order.
      // -------------------------------------------------------

      if (!image && order?.image) {
        image = getImageUrl(
          order.image
        );
      }

      // -------------------------------------------------------
      // IMAGE DEBUG
      // -------------------------------------------------------

      console.log(
        "🖼️ ORDER IMAGE DEBUG:",
        {
          orderId: order.id,
          firstItem,
          originalImage:
            firstItem?.image,
          image,
          imageType:
            typeof firstItem?.image,
          hasImage:
            Boolean(image),
        }
      );

      if (!image) {
        console.warn(
          "⚠️ NO PRODUCT IMAGE FOUND FOR ORDER:",
          order.id
        );

        console.warn(
          "⚠️ First item:",
          firstItem
        );
      } else {
        console.log(
          "✅ PRODUCT IMAGE FOUND:",
          image
        );
      }

      // -------------------------------------------------------
      // Full order debug
      // -------------------------------------------------------

      console.log(
        "📦 Formatting order:",
        {
          id: order.id,
          user_id: order.user_id,
          items,
          name,
          image,
          paymentStatus:
            order.paymentStatus,
          status: order.status,
          price: order.price,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total,
        }
      );

      return {
        id: `ORD-${order.id}`,

        name,

        image,

        status:
          order.status ||
          "Paid / Processing",

        paymentStatus:
          order.paymentStatus ||
          "",

        price: `$${Number(
          order.price || 0
        ).toFixed(2)}`,

        shipping: `$${Number(
          order.shipping || 0
        ).toFixed(2)}`,

        tax: `$${Number(
          order.tax || 0
        ).toFixed(2)}`,

        total: `$${Number(
          order.total || 0
        ).toFixed(2)}`,
      };
    });
  };

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const loadOrders = async (
    firebaseUser: any
  ) => {
    try {
      console.log(
        "======================================"
      );

      console.log(
        "🔎 ORDERS DEBUG: START"
      );

      console.log(
        "======================================"
      );

      // -------------------------------------------------------
      // Firebase user
      // -------------------------------------------------------

      console.log(
        "🔎 Firebase user object:",
        firebaseUser
      );

      if (!firebaseUser) {
        console.error(
          "❌ ORDERS DEBUG: firebaseUser is NULL/UNDEFINED"
        );

        setOrders([]);

        return;
      }

      console.log(
        "✅ Firebase user exists"
      );

      console.log(
        "🔎 Firebase UID:",
        firebaseUser.uid
      );

      console.log(
        "🔎 Firebase email:",
        firebaseUser.email
      );

      // -------------------------------------------------------
      // UID
      // -------------------------------------------------------

      const userId =
        firebaseUser.uid;

      if (!userId) {
        console.error(
          "❌ ORDERS DEBUG: Firebase user has NO UID"
        );

        setOrders([]);

        return;
      }

      console.log(
        "✅ UID exists:",
        userId
      );

      // -------------------------------------------------------
      // Firebase ID token
      // -------------------------------------------------------

      console.log(
        "🔎 Requesting Firebase ID token..."
      );

      const token =
        await firebaseUser.getIdToken(
          true
        );

      if (!token) {
        console.error(
          "❌ Firebase ID token is EMPTY"
        );

        setOrders([]);

        return;
      }

      console.log(
        "✅ Firebase ID token received"
      );

      // -------------------------------------------------------
      // API URL
      // -------------------------------------------------------

      const apiUrl =
        `/api/orders/get?user_id=${encodeURIComponent(
          userId
        )}`;

      console.log(
        "🔎 ORDERS API URL:",
        apiUrl
      );

      console.log(
        "🔎 user_id being sent:",
        userId
      );

      // -------------------------------------------------------
      // Call API
      // -------------------------------------------------------

      const response =
        await fetch(
          apiUrl,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );

      console.log(
        "🔎 Orders API HTTP status:",
        response.status
      );

      // -------------------------------------------------------
      // Raw response
      // -------------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "🔎 RAW ORDERS API RESPONSE:",
        responseText
      );

      // -------------------------------------------------------
      // Parse JSON
      // -------------------------------------------------------

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};
      } catch (error) {
        console.error(
          "❌ Orders API returned INVALID JSON",
          error
        );

        setOrders([]);

        return;
      }

      console.log(
        "✅ Parsed Orders API response:",
        data
      );

      // -------------------------------------------------------
      // HTTP error
      // -------------------------------------------------------

      if (!response.ok) {
        console.error(
          "❌ ORDERS API ERROR:",
          data?.error
        );

        setOrders([]);

        return;
      }

      // -------------------------------------------------------
      // API success
      // -------------------------------------------------------

      if (!data.success) {
        console.error(
          "❌ Orders API success=false:",
          data?.error
        );

        setOrders([]);

        return;
      }

      // -------------------------------------------------------
      // Database orders
      // -------------------------------------------------------

      const databaseOrders =
        Array.isArray(
          data.orders
        )
          ? data.orders
          : [];

      console.log(
        "======================================"
      );

      console.log(
        "📦 FIRESTORE ORDERS RECEIVED"
      );

      console.log(
        "Number of orders:",
        databaseOrders.length
      );

      console.log(
        "Full orders:",
        databaseOrders
      );

      console.log(
        "======================================"
      );

      // -------------------------------------------------------
      // Inspect orders
      // -------------------------------------------------------

      databaseOrders.forEach(
        (
          order: any,
          index: number
        ) => {
          console.log(
            `📦 ORDER ${index + 1}`
          );

          console.log(
            "Document ID:",
            order.id
          );

          console.log(
            "Stored user_id:",
            order.user_id
          );

          console.log(
            "Payment status:",
            order.paymentStatus
          );

          console.log(
            "Status:",
            order.status
          );

          console.log(
            "Items:",
            order.items
          );
        }
      );

      // -------------------------------------------------------
      // Filter paid orders
      // -------------------------------------------------------

      const paidOrders =
        databaseOrders.filter(
          (order: any) => {
            const paymentStatus =
              String(
                order.paymentStatus ||
                  ""
              )
                .trim()
                .toLowerCase();

            return (
              paymentStatus ===
              "paid"
            );
          }
        );

      console.log(
        "💳 PAID ORDERS:",
        paidOrders.length
      );

      // -------------------------------------------------------
      // Sort newest first
      // -------------------------------------------------------

      paidOrders.sort(
        (
          a: any,
          b: any
        ) => {
          const dateA =
            new Date(
              a.createdAt || 0
            ).getTime();

          const dateB =
            new Date(
              b.createdAt || 0
            ).getTime();

          return (
            dateB - dateA
          );
        }
      );

      // -------------------------------------------------------
      // Format orders
      // -------------------------------------------------------

      const formattedOrders =
        formatOrders(
          paidOrders
        );

      console.log(
        "======================================"
      );

      console.log(
        "✅ FORMATTED ORDERS:",
        formattedOrders
      );

      console.log(
        "======================================"
      );

      setOrders(
        formattedOrders
      );

      console.log(
        "✅ Orders state updated"
      );
    } catch (error: any) {
      console.error(
        "======================================"
      );

      console.error(
        "❌ ORDERS LOAD CRASHED"
      );

      console.error(
        error
      );

      console.error(
        error?.message
      );

      console.error(
        "======================================"
      );

      setOrders([]);
    }
  };

  // =========================================================
  // FIREBASE AUTH
  // =========================================================

  useEffect(() => {
    console.log(
      "🔎 Orders - waiting for Firebase authentication..."
    );

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          firebaseUser
        ) => {
          try {
            if (!firebaseUser) {
              console.warn(
                "⚠️ No Firebase user is signed in."
              );

              setOrders([]);

              setLoading(false);

              return;
            }

            console.log(
              "✅ FIREBASE USER AUTHENTICATED"
            );

            console.log(
              "Firebase UID:",
              firebaseUser.uid
            );

            await loadOrders(
              firebaseUser
            );
          } catch (error) {
            console.error(
              "❌ Authentication error:",
              error
            );

            setOrders([]);
          } finally {
            setLoading(false);
          }
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // =========================================================
  // TRACK ORDER
  // =========================================================

  const trackOrder = async (
    orderId: string
  ) => {
    try {
      setTrackingOrder(
        orderId
      );

      const firebaseUser =
        auth.currentUser;

      if (!firebaseUser) {
        console.error(
          "❌ Cannot track order: no Firebase user."
        );

        return;
      }

      await loadOrders(
        firebaseUser
      );
    } catch (error) {
      console.error(
        "❌ Failed to refresh orders:",
        error
      );
    } finally {
      setTrackingOrder(null);
    }
  };

  // =========================================================
  // CANCEL ORDER
  // =========================================================

  const handleCancelOrder =
    async (
      orderId: string
    ) => {
      try {
        const firestoreId =
          orderId.startsWith(
            "ORD-"
          )
            ? orderId.substring(4)
            : orderId;

        const firebaseUser =
          auth.currentUser;

        if (!firebaseUser) {
          console.error(
            "❌ Cannot cancel order: no Firebase user."
          );

          return;
        }

        const token =
          await firebaseUser.getIdToken(
            true
          );

        const response =
          await fetch(
            "/api/orders/delete",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                id: firestoreId,
              }),
            }
          );

        const text =
          await response.text();

        let data: any = {};

        try {
          data = text
            ? JSON.parse(
                text
              )
            : {};
        } catch {
          console.error(
            "❌ Invalid delete response:",
            text
          );

          return;
        }

        if (data.success) {
          setOrders(
            (
              previousOrders
            ) =>
              previousOrders.filter(
                (order) =>
                  order.id !==
                  orderId
              )
          );
        } else {
          console.error(
            "❌ Failed to cancel order:",
            data?.error
          );
        }
      } catch (error) {
        console.error(
          "❌ Cancel order error:",
          error
        );
      }
    };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      className={
        styles.container
      }
    >
      <h1
        className={
          styles.title
        }
      >
        Your Orders
      </h1>

      {loading ? (
        <div
          className={
            styles.emptyState
          }
        >
          <p>
            Loading orders...
          </p>
        </div>
      ) : orders.length ===
        0 ? (
        <div
          className={
            styles.emptyState
          }
        >
          <p>
            No completed orders
            found.
          </p>

          <Link
            href="/glowsticks"
            className={
              styles.shopGlowBtn
            }
          >
            Shop Glow Sticks
          </Link>
        </div>
      ) : (
        <div
          className={
            styles.ordersList
          }
        >
          {orders.map(
            (order) => (
              <div
                key={
                  order.id
                }
                className={
                  styles.orderCard
                }
              >
                {/* ==========================================
                    LEFT SIDE
                ========================================== */}

                <div
                  className={
                    styles.orderLeft
                  }
                >
                  {order.image ? (
                    <Image
                      src={
                        order.image
                      }
                      width={80}
                      height={80}
                      className={
                        styles.productImg
                      }
                      alt={
                        order.name
                      }
                      unoptimized
                      onError={() => {
                        console.error(
                          "❌ PRODUCT IMAGE FAILED TO LOAD:",
                          {
                            orderId:
                              order.id,
                            image:
                              order.image,
                          }
                        );
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width:
                          "80px",
                        height:
                          "80px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "8px",
                        fontSize:
                          "12px",
                        textAlign:
                          "center",
                      }}
                    >
                      No image
                    </div>
                  )}

                  <div
                    className={
                      styles.orderDetails
                    }
                  >
                    <h3>
                      {
                        order.name
                      }
                    </h3>

                    <span
                      className={
                        styles.statusBadge
                      }
                    >
                      Status:{" "}
                      {
                        order.status
                      }
                    </span>
                  </div>
                </div>

                {/* ==========================================
                    RIGHT SIDE
                ========================================== */}

                <div
                  className={
                    styles.orderRight
                  }
                >
                  <div
                    className={
                      styles.priceInfo
                    }
                  >
                    Price:{" "}
                    <span>
                      {
                        order.price
                      }
                    </span>
                  </div>

                  <div
                    className={
                      styles.priceInfo
                    }
                  >
                    Shipping:{" "}
                    <span>
                      {
                        order.shipping
                      }
                    </span>
                  </div>

                  <div
                    className={
                      styles.priceInfo
                    }
                  >
                    Tax:{" "}
                    <span>
                      {
                        order.tax
                      }
                    </span>
                  </div>

                  <div
                    className={
                      styles.priceInfo
                    }
                  >
                    Total:{" "}
                    <span>
                      {
                        order.total
                      }
                    </span>
                  </div>

                  <div
                    className={
                      styles.buttonGroup
                    }
                  >
                    <button
                      onClick={() =>
                        trackOrder(
                          order.id
                        )
                      }
                      className={
                        styles.trackBtn
                      }
                      disabled={
                        trackingOrder ===
                        order.id
                      }
                    >
                      {trackingOrder ===
                      order.id
                        ? "Checking..."
                        : "Track Order"}
                    </button>

                    {order.status ===
                      "Paid / Processing" && (
                      <button
                        className={
                          styles.cancelBtn
                        }
                        onClick={() =>
                          handleCancelOrder(
                            order.id
                          )
                        }
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}