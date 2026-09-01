"use client";

import { useEffect, useState } from "react";
import styles from "./page.orders.module.css";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/db";

type OrderItem = {
  name: string;
  image: string;
  quantity: number;
  price: number;
  description?: string;
};

type Order = {
  id: string;
  items: OrderItem[];
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
  const [message, setMessage] = useState("");

  /* ---------------------------------------------------------
     FORMAT IMAGE URL
  --------------------------------------------------------- */

  const formatImageUrl = (image: any): string => {
    if (!image) {
      return "/images/glowstick-placeholder.png";
    }

    if (typeof image !== "string") {
      return "/images/glowstick-placeholder.png";
    }

    const trimmed = image.trim();

    if (!trimmed) {
      return "/images/glowstick-placeholder.png";
    }

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/")
    ) {
      return trimmed;
    }

    return `/${trimmed.replace(/^\/+/, "")}`;
  };

  /* ---------------------------------------------------------
     FORMAT ORDERS
  --------------------------------------------------------- */

  const formatOrders = (data: any[]): Order[] => {
    return data.map((order: any) => {
      let rawItems: any[] = [];

      try {
        if (Array.isArray(order.items)) {
          rawItems = order.items;
        } else if (typeof order.items === "string") {
          const parsed = JSON.parse(order.items);
          rawItems = Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error("Could not parse order items:", error);
        rawItems = [];
      }

      const items: OrderItem[] = rawItems.map((item: any) => ({
        name: item?.name || "Glow Stick",
        image: formatImageUrl(item?.image),
        quantity: Number(item?.quantity) || 1,
        price: Number(item?.price) || 0,
        description: item?.description || "",
      }));

      return {
        // Uses the actual Firestore document ID.
        // No ORD- prefix.
        id: String(order.id),

        items,

        status: order.status || "Processing",

        paymentStatus: order.paymentStatus || order.payment_status || "Paid",

        price: `$${Number(order.price || 0).toFixed(2)}`,

        shipping: `$${Number(order.shipping || 0).toFixed(2)}`,

        tax: `$${Number(order.tax || 0).toFixed(2)}`,

        total: `$${Number(order.total || 0).toFixed(2)}`,
      };
    });
  };

  /* ---------------------------------------------------------
     LOAD ORDERS
  --------------------------------------------------------- */

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadOrders = async (userId: string, token: string) => {
      try {
        console.log("Loading orders for Firebase user:", userId);

        const response = await fetch(
          `/api/orders/get?user_id=${encodeURIComponent(
            userId,
          )}&t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
          },
        );

        const responseText = await response.text();

        console.log("Orders API status:", response.status);

        console.log("Orders API response:", responseText);

        if (!response.ok) {
          throw new Error(
            `Orders API returned ${response.status}: ${responseText}`,
          );
        }

        let data: any;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Orders API returned invalid JSON.");
        }

        if (!data?.success) {
          throw new Error(data?.error || "Unable to load orders.");
        }

        const formattedOrders = formatOrders(
          Array.isArray(data.orders) ? data.orders : [],
        );

        setOrders(formattedOrders);
        setMessage("");

        console.log("Formatted orders:", formattedOrders);
      } catch (error) {
        console.error("Error loading orders:", error);

        setOrders([]);

        setMessage(
          error instanceof Error ? error.message : "Unable to load orders.",
        );
      } finally {
        setLoading(false);
      }
    };

    unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Firebase auth state changed:", user);

      if (!user) {
        console.error("No Firebase user is currently signed in.");

        setOrders([]);
        setLoading(false);

        setMessage("Please sign in to view your orders.");

        return;
      }

      try {
        const token = await user.getIdToken();

        await loadOrders(user.uid, token);
      } catch (error) {
        console.error("Could not get Firebase ID token:", error);

        setOrders([]);
        setLoading(false);

        setMessage("Your session could not be verified. Please sign in again.");
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /* ---------------------------------------------------------
     CANCEL ORDER
  --------------------------------------------------------- */

  const handleCancelOrder = async (orderId: string) => {
    if (!orderId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const user = auth.currentUser;

      if (!user) {
        alert("You must be signed in to cancel an order.");
        return;
      }

      const token = await user.getIdToken();

      // This is now the actual Firestore document ID.
      const firestoreId = orderId;

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

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Cancel order API returned invalid JSON.");
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to cancel the order.");
      }

      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== orderId),
      );

      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling order:", error);

      alert(error instanceof Error ? error.message : "Unable to cancel order.");
    }
  };

  /* ---------------------------------------------------------
     TRACK ORDER
  --------------------------------------------------------- */

  const handleTrackOrder = (orderId: string) => {
    setTrackingOrder(orderId);

    setTimeout(() => {
      setTrackingOrder(null);
    }, 3000);
  };

  /* ---------------------------------------------------------
     LOADING
  --------------------------------------------------------- */

  if (loading) {
    return (
      <main className={styles.ordersPage}>
        <div className={styles.container}>
          <h1
            style={{
              color: "#ADFF2F",
            }}
          >
            My Orders
          </h1>

          <div className={styles.loading}>Loading your orders...</div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------
     PAGE
  --------------------------------------------------------- */

  return (
    <main className={styles.ordersPage}>
      <div className={styles.container}>
        {/* PAGE HEADER */}
        <div className={styles.header}>
          <div>
            <h1
              style={{
                color: "#ADFF2F",
              }}
            >
              My Orders
            </h1>

            <p>View and manage your GlowRush orders.</p>
          </div>

          <Link href="/" className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>

        {/* MESSAGE */}
        {message && <div className={styles.message}>{message}</div>}

        {/* EMPTY ORDERS */}
        {!message && orders.length === 0 && (
          <div className={styles.emptyOrders}>
            <h2>No orders yet</h2>

            <p>Once you place an order, it will appear here.</p>

            <Link href="/" className={styles.shopButton}>
              Start Shopping
            </Link>
          </div>
        )}

        {/* ORDERS */}
        {orders.length > 0 && (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                {/* ORDER HEADER */}
                <div className={styles.orderHeader}>
                  <div>
                    <h2>Order #{order.id}</h2>

                    <p>
                      Payment: <strong>{order.paymentStatus}</strong>
                    </p>
                  </div>

                  <div className={styles.orderStatus}>{order.status}</div>
                </div>

                {/* PRODUCTS */}
                <div className={styles.orderItems}>
                  {order.items.length === 0 ? (
                    <p>No products found for this order.</p>
                  ) : (
                    order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className={styles.orderItem}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                          padding: "20px 0",
                          borderBottom:
                            index < order.items.length - 1
                              ? "1px solid #eee"
                              : "none",
                        }}
                      >
                        {/* PRODUCT IMAGE */}
                        <div
                          style={{
                            width: "90px",
                            height: "90px",
                            position: "relative",
                            flexShrink: 0,
                            borderRadius: "10px",
                            overflow: "hidden",
                            background: "#f5f5f5",
                          }}
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="90px"
                            style={{
                              objectFit: "contain",
                            }}
                          />
                        </div>

                        {/* PRODUCT INFO */}
                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          {/* PRODUCT NAME */}
                          <h3
                            style={{
                              margin: "0 0 6px",
                              color: "#ADFF2F",
                            }}
                          >
                            {item.name}
                          </h3>

                          {item.description && (
                            <p
                              style={{
                                margin: "0 0 8px",
                                color: "#ADFF2F",
                                fontSize: "14px",
                              }}
                            >
                              {item.description}
                            </p>
                          )}

                          {/* QUANTITY */}
                          <p
                            style={{
                              margin: 0,
                              color: "#ADFF2F",
                            }}
                          >
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        {/* PRODUCT PRICE */}
                        <div
                          style={{
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            color: "#ADFF2F",
                          }}
                        >
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ORDER TOTALS */}
                <div className={styles.orderTotals}>
                  <div>
                    <span>Subtotal</span>

                    <span>{order.price}</span>
                  </div>

                  <div>
                    <span>Shipping</span>

                    <span>{order.shipping}</span>
                  </div>

                  <div>
                    <span>Tax</span>

                    <span>{order.tax}</span>
                  </div>

                  <div className={styles.orderTotal}>
                    <strong>Total</strong>

                    <strong>{order.total}</strong>
                  </div>
                </div>

                {/* ORDER ACTIONS */}
                <div className={styles.orderActions}>
                  <button
                    type="button"
                    onClick={() => handleTrackOrder(order.id)}
                    className={styles.trackButton}
                  >
                    {trackingOrder === order.id ? "Tracking..." : "Track Order"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order.id)}
                    className={styles.cancelButton}
                  >
                    Cancel Order
                  </button>
                </div>

                {/* TRACKING MESSAGE */}
                {trackingOrder === order.id && (
                  <div className={styles.trackingMessage}>
                    Your order is being processed. Tracking information will
                    appear once your package ships.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
