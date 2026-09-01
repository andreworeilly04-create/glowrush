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
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);

  // =========================================================
  // FORMAT ORDERS
  // =========================================================

  const formatOrders = (databaseOrders: any[]): Order[] => {
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
        console.error("Orders - failed to parse items:", error);
      }

      const firstItem = items.length > 0 ? items[0] : null;

      const name =
        items.length > 0
          ? items
              .map(
                (item: any) =>
                  `${item?.name || "Item"} (Quantity: ${
                    Number(item?.quantity) || 1
                  })`,
              )
              .join(", ")
          : "GlowRush Order";

      let image = "";

      if (firstItem?.image) {
        if (typeof firstItem.image === "string") {
          image = firstItem.image;
        } else if (typeof firstItem.image === "object" && firstItem.image.src) {
          image = firstItem.image.src;
        }
      }

      return {
        id: `ORD-${order.id}`,

        name,

        image,

        status: order.status || "Paid / Processing",

        paymentStatus: order.paymentStatus || "",

        price: `$${Number(order.price || 0).toFixed(2)}`,

        shipping: `$${Number(order.shipping || 0).toFixed(2)}`,

        tax: `$${Number(order.tax || 0).toFixed(2)}`,

        total: `$${Number(order.total || 0).toFixed(2)}`,
      };
    });
  };

  // =========================================================
  // LOAD ORDERS THROUGH SERVER
  // =========================================================

  const loadOrders = async (firebaseUser: any) => {
    try {
      console.log("======================================");

      console.log("ORDERS: Loading orders");

      console.log("Firebase UID:", firebaseUser?.uid);

      console.log("======================================");

      // -------------------------------------------------------
      // Make sure user exists
      // -------------------------------------------------------

      if (!firebaseUser) {
        console.error("Orders - no Firebase user.");

        setOrders([]);

        return;
      }

      const userId = firebaseUser.uid;

      if (!userId) {
        console.error("Orders - Firebase user has no UID.");

        setOrders([]);

        return;
      }

      // -------------------------------------------------------
      // Get Firebase authentication token
      // -------------------------------------------------------

      console.log("Orders - getting Firebase ID token...");

      const token = await firebaseUser.getIdToken(true);

      if (!token) {
        console.error("Orders - Firebase ID token was not returned.");

        setOrders([]);

        return;
      }

      console.log("Orders - Firebase ID token received.");

      // -------------------------------------------------------
      // Call server-side Orders API
      // -------------------------------------------------------

      console.log("Orders - calling /api/orders/get...");

      const response = await fetch(
        `/api/orders/get?user_id=${encodeURIComponent(userId)}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          cache: "no-store",
        },
      );

      console.log("Orders API status:", response.status);

      // -------------------------------------------------------
      // Read response safely
      // -------------------------------------------------------

      const responseText = await response.text();

      let data: any = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Orders - server returned invalid JSON:", responseText);

        setOrders([]);

        return;
      }

      console.log("Orders API response:", data);

      // -------------------------------------------------------
      // Handle API error
      // -------------------------------------------------------

      if (!response.ok) {
        console.error(
          "Orders API returned error:",
          response.status,
          data?.error,
        );

        setOrders([]);

        return;
      }

      if (!data.success) {
        console.error("Orders API failed:", data?.error);

        setOrders([]);

        return;
      }

      // -------------------------------------------------------
      // Get orders from API
      // -------------------------------------------------------

      const databaseOrders = Array.isArray(data.orders) ? data.orders : [];

      console.log("Orders received from server:", databaseOrders.length);

      // -------------------------------------------------------
      // Log each order for debugging
      // -------------------------------------------------------

      databaseOrders.forEach((order: any) => {
        console.log("Firestore order:", {
          id: order.id,
          user_id: order.user_id,
          paymentStatus: order.paymentStatus,
          status: order.status,
          createdAt: order.createdAt,
        });
      });

      // -------------------------------------------------------
      // Only show paid orders
      // -------------------------------------------------------

      const paidOrders = databaseOrders.filter((order: any) => {
        const paymentStatus = String(order.paymentStatus || "")
          .trim()
          .toLowerCase();

        return paymentStatus === "paid";
      });

      console.log("Paid orders:", paidOrders.length);

      // -------------------------------------------------------
      // Sort newest first
      // -------------------------------------------------------

      paidOrders.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();

        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });

      // -------------------------------------------------------
      // Format orders for display
      // -------------------------------------------------------

      const formattedOrders = formatOrders(paidOrders);

      console.log("Formatted orders:", formattedOrders);

      setOrders(formattedOrders);
    } catch (error: any) {
      console.error("======================================");

      console.error("ORDERS LOAD ERROR:", error);

      console.error("Error message:", error?.message);

      console.error("======================================");

      setOrders([]);
    }
  };

  // =========================================================
  // WATCH FIREBASE AUTHENTICATION
  // =========================================================

  useEffect(() => {
    console.log("Orders - waiting for Firebase authentication...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // -------------------------------------------------
        // No user
        // -------------------------------------------------

        if (!firebaseUser) {
          console.warn("Orders - no Firebase user is signed in.");

          setOrders([]);

          setLoading(false);

          return;
        }

        // -------------------------------------------------
        // User exists
        // -------------------------------------------------

        console.log("======================================");

        console.log("ORDERS: Firebase user authenticated");

        console.log("Firebase UID:", firebaseUser.uid);

        console.log("Firebase email:", firebaseUser.email);

        console.log("======================================");

        // -------------------------------------------------
        // Load through server
        // -------------------------------------------------

        await loadOrders(firebaseUser);
      } catch (error) {
        console.error("Orders - authentication error:", error);

        setOrders([]);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // =========================================================
  // TRACK ORDER
  // =========================================================

  const trackOrder = async (orderId: string) => {
    try {
      setTrackingOrder(orderId);

      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        console.error(
          "Orders - cannot track order because no Firebase user is signed in.",
        );

        return;
      }

      console.log("Refreshing order:", orderId);

      await loadOrders(firebaseUser);
    } catch (error) {
      console.error("Orders - failed to refresh orders:", error);
    } finally {
      setTrackingOrder(null);
    }
  };

  // =========================================================
  // CANCEL ORDER
  // =========================================================

  const handleCancelOrder = async (orderId: string) => {
    try {
      const firestoreId = orderId.startsWith("ORD-")
        ? orderId.substring(4)
        : orderId;

      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        console.error(
          "Orders - cannot cancel order because no Firebase user is signed in.",
        );

        return;
      }

      // -----------------------------------------------------
      // Get Firebase token
      // -----------------------------------------------------

      const token = await firebaseUser.getIdToken(true);

      // -----------------------------------------------------
      // Call server delete API
      // -----------------------------------------------------

      const response = await fetch("/api/orders/delete", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          id: firestoreId,
        }),
      });

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("Orders - invalid delete response:", text);

        return;
      }

      console.log("Delete order response:", data);

      if (data.success) {
        setOrders((previousOrders) =>
          previousOrders.filter((order) => order.id !== orderId),
        );
      } else {
        console.error("Orders - failed to cancel order:", data?.error);
      }
    } catch (error) {
      console.error("Orders - cancel order error:", error);
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Orders</h1>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className={styles.emptyState}>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        /* ===================================================
           NO ORDERS
        =================================================== */

        <div className={styles.emptyState}>
          <p>No completed orders found.</p>

          <Link href="/glowsticks" className={styles.shopGlowBtn}>
            Shop Glow Sticks
          </Link>
        </div>
      ) : (
        /* ===================================================
           ORDERS
        =================================================== */

        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              {/* ==========================================
                    LEFT SIDE
                ========================================== */}

              <div className={styles.orderLeft}>
                {order.image && (
                  <Image
                    src={order.image}
                    width={80}
                    height={80}
                    className={styles.productImg}
                    alt={order.name}
                  />
                )}

                <div className={styles.orderDetails}>
                  <h3>{order.name}</h3>

                  <span className={styles.statusBadge}>
                    Status: {order.status}
                  </span>
                </div>
              </div>

              {/* ==========================================
                    RIGHT SIDE
                ========================================== */}

              <div className={styles.orderRight}>
                <div className={styles.priceInfo}>
                  Price: <span>{order.price}</span>
                </div>

                <div className={styles.priceInfo}>
                  Shipping: <span>{order.shipping}</span>
                </div>

                <div className={styles.priceInfo}>
                  Tax: <span>{order.tax}</span>
                </div>

                <div className={styles.priceInfo}>
                  Total: <span>{order.total}</span>
                </div>

                {/* ========================================
                      BUTTONS
                  ======================================== */}

                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => trackOrder(order.id)}
                    className={styles.trackBtn}
                    disabled={trackingOrder === order.id}
                  >
                    {trackingOrder === order.id ? "Checking..." : "Track Order"}
                  </button>

                  {order.status === "Paid / Processing" && (
                    <button
                      className={styles.cancelBtn}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
