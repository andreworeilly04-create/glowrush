"use client";

import { useEffect, useState } from "react";
import styles from "./page.orders.module.css";
import Image from "next/image";
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
  // FORMAT ORDERS
  // =========================================================

  const formatOrders = (
    databaseOrders: any[]
  ): Order[] => {
    console.log(
      "🔎 ORDERS DEBUG: formatOrders received:",
      databaseOrders
    );

    return databaseOrders.map((order: any) => {
      let items: any[] = [];

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

      const firstItem =
        items.length > 0
          ? items[0]
          : null;

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

      let image = "";

      if (firstItem?.image) {
        if (
          typeof firstItem.image ===
          "string"
        ) {
          image = firstItem.image;
        } else if (
          typeof firstItem.image ===
            "object" &&
          firstItem.image.src
        ) {
          image = firstItem.image.src;
        }
      }

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
          order.paymentStatus || "",

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
      // 1. Check Firebase user
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
        "✅ ORDERS DEBUG: Firebase user exists"
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
      // 2. Get UID
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
        "✅ ORDERS DEBUG: UID exists:",
        userId
      );

      // -------------------------------------------------------
      // 3. Get Firebase ID token
      // -------------------------------------------------------

      console.log(
        "🔎 ORDERS DEBUG: Requesting Firebase ID token..."
      );

      const token =
        await firebaseUser.getIdToken(
          true
        );

      if (!token) {
        console.error(
          "❌ ORDERS DEBUG: Firebase ID token is EMPTY"
        );

        setOrders([]);

        return;
      }

      console.log(
        "✅ ORDERS DEBUG: Firebase ID token received"
      );

      console.log(
        "🔎 Token length:",
        token.length
      );

      // -------------------------------------------------------
      // 4. Build API URL
      // -------------------------------------------------------

      const apiUrl =
        `/api/orders/get?user_id=${encodeURIComponent(
          userId
        )}`;

      console.log(
        "🔎 ORDERS DEBUG: API URL:",
        apiUrl
      );

      console.log(
        "🔎 ORDERS DEBUG: Sending user_id:",
        userId
      );

      // -------------------------------------------------------
      // 5. Call Orders API
      // -------------------------------------------------------

      console.log(
        "🔎 ORDERS DEBUG: Calling /api/orders/get..."
      );

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
        "🔎 ORDERS DEBUG: API HTTP status:",
        response.status
      );

      console.log(
        "🔎 ORDERS DEBUG: API response OK:",
        response.ok
      );

      // -------------------------------------------------------
      // 6. Read raw response
      // -------------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "🔎 ORDERS DEBUG: RAW API RESPONSE:",
        responseText
      );

      // -------------------------------------------------------
      // 7. Parse response
      // -------------------------------------------------------

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};

        console.log(
          "✅ ORDERS DEBUG: Parsed API response:",
          data
        );
      } catch (error) {
        console.error(
          "❌ ORDERS DEBUG: API returned INVALID JSON"
        );

        console.error(
          "❌ Raw response:",
          responseText
        );

        setOrders([]);

        return;
      }

      // -------------------------------------------------------
      // 8. Check HTTP error
      // -------------------------------------------------------

      if (!response.ok) {
        console.error(
          "❌ ORDERS DEBUG: Orders API returned an ERROR"
        );

        console.error(
          "❌ HTTP status:",
          response.status
        );

        console.error(
          "❌ Server error:",
          data?.error
        );

        console.error(
          "❌ Server response:",
          data
        );

        setOrders([]);

        return;
      }

      console.log(
        "✅ ORDERS DEBUG: Orders API request succeeded"
      );

      // -------------------------------------------------------
      // 9. Check success
      // -------------------------------------------------------

      if (!data.success) {
        console.error(
          "❌ ORDERS DEBUG: API success=false"
        );

        console.error(
          "❌ API error:",
          data?.error
        );

        setOrders([]);

        return;
      }

      console.log(
        "✅ ORDERS DEBUG: API success=true"
      );

      // -------------------------------------------------------
      // 10. Get orders
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
        "📦 ORDERS DEBUG: FIRESTORE ORDERS"
      );

      console.log(
        "📦 Number of orders:",
        databaseOrders.length
      );

      console.log(
        "📦 Orders:",
        databaseOrders
      );

      console.log(
        "======================================"
      );

      // -------------------------------------------------------
      // 11. Check every order
      // -------------------------------------------------------

      if (
        databaseOrders.length === 0
      ) {
        console.warn(
          "⚠️ ORDERS DEBUG: Firestore returned ZERO orders"
        );

        console.warn(
          "⚠️ UID used for query:",
          userId
        );

        console.warn(
          "⚠️ This means either the webhook did not create the order OR the stored user_id does not match this Firebase UID."
        );
      }

      databaseOrders.forEach(
        (
          order: any,
          index: number
        ) => {
          console.log(
            `📦 ORDER ${index + 1}:`
          );

          console.log(
            "   Firestore document ID:",
            order.id
          );

          console.log(
            "   Stored user_id:",
            order.user_id
          );

          console.log(
            "   Current Firebase UID:",
            userId
          );

          console.log(
            "   user_id MATCH:",
            String(
              order.user_id
            ) ===
              String(userId)
          );

          console.log(
            "   paymentStatus:",
            order.paymentStatus
          );

          console.log(
            "   status:",
            order.status
          );

          console.log(
            "   total:",
            order.total
          );

          console.log(
            "   items:",
            order.items
          );

          console.log(
            "   createdAt:",
            order.createdAt
          );
        }
      );

      // -------------------------------------------------------
      // 12. Filter paid orders
      // -------------------------------------------------------

      console.log(
        "🔎 ORDERS DEBUG: Filtering paid orders..."
      );

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

            const isPaid =
              paymentStatus ===
              "paid";

            console.log(
              "💳 Checking payment status:",
              {
                orderId:
                  order.id,

                paymentStatus:
                  order.paymentStatus,

                normalized:
                  paymentStatus,

                isPaid,
              }
            );

            return isPaid;
          }
        );

      console.log(
        "💳 ORDERS DEBUG: Paid orders:",
        paidOrders.length
      );

      // -------------------------------------------------------
      // 13. Sort newest first
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
      // 14. Format orders
      // -------------------------------------------------------

      console.log(
        "🔎 ORDERS DEBUG: Formatting orders..."
      );

      const formattedOrders =
        formatOrders(
          paidOrders
        );

      console.log(
        "✅ ORDERS DEBUG: Formatted orders:",
        formattedOrders
      );

      // -------------------------------------------------------
      // 15. Set orders
      // -------------------------------------------------------

      setOrders(
        formattedOrders
      );

      console.log(
        "======================================"
      );

      console.log(
        "✅ ORDERS DEBUG: COMPLETE"
      );

      console.log(
        "Displayed orders:",
        formattedOrders.length
      );

      console.log(
        "======================================"
      );
    } catch (error: any) {
      console.error(
        "======================================"
      );

      console.error(
        "❌ ORDERS DEBUG: LOAD ORDERS CRASHED"
      );

      console.error(
        "❌ Error:",
        error
      );

      console.error(
        "❌ Error message:",
        error?.message
      );

      console.error(
        "❌ Error stack:",
        error?.stack
      );

      console.error(
        "======================================"
      );

      setOrders([]);
    }
  };

  // =========================================================
  // WATCH FIREBASE AUTHENTICATION
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
            // -------------------------------------------------
            // No user
            // -------------------------------------------------

            if (!firebaseUser) {
              console.warn(
                "⚠️ Orders - no Firebase user is signed in."
              );

              setOrders([]);

              setLoading(false);

              return;
            }

            // -------------------------------------------------
            // User exists
            // -------------------------------------------------

            console.log(
              "======================================"
            );

            console.log(
              "✅ ORDERS: Firebase user authenticated"
            );

            console.log(
              "Firebase UID:",
              firebaseUser.uid
            );

            console.log(
              "Firebase email:",
              firebaseUser.email
            );

            console.log(
              "======================================"
            );

            // -------------------------------------------------
            // Load orders
            // -------------------------------------------------

            await loadOrders(
              firebaseUser
            );
          } catch (error) {
            console.error(
              "❌ Orders - authentication error:",
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
          "❌ Orders - cannot track order because no Firebase user is signed in."
        );

        return;
      }

      console.log(
        "🔄 Refreshing order:",
        orderId
      );

      await loadOrders(
        firebaseUser
      );
    } catch (error) {
      console.error(
        "❌ Orders - failed to refresh orders:",
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
            "❌ Orders - cannot cancel order because no Firebase user is signed in."
          );

          return;
        }

        // -----------------------------------------------------
        // Get Firebase token
        // -----------------------------------------------------

        const token =
          await firebaseUser.getIdToken(
            true
          );

        // -----------------------------------------------------
        // Call delete API
        // -----------------------------------------------------

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

        console.log(
          "Delete order HTTP status:",
          response.status
        );

        const text =
          await response.text();

        let data: any = {};

        try {
          data = text
            ? JSON.parse(text)
            : {};
        } catch {
          console.error(
            "❌ Orders - invalid delete response:",
            text
          );

          return;
        }

        console.log(
          "Delete order response:",
          data
        );

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
            "❌ Orders - failed to cancel order:",
            data?.error
          );
        }
      } catch (error) {
        console.error(
          "❌ Orders - cancel order error:",
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

      {/* =====================================================
          LOADING
      ===================================================== */}

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
        /* ===================================================
           NO ORDERS
        =================================================== */

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
        /* ===================================================
           ORDERS
        =================================================== */

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
                  {order.image && (
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
                    />
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

                  {/* ========================================
                      BUTTONS
                  ======================================== */}

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