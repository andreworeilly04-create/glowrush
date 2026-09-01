"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./page.orders.module.css";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
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

function getImageUrl(image: any): string {
  if (!image) return "/placeholder.png";

  if (typeof image === "string") {
    return image;
  }

  if (image.src) {
    return image.src;
  }

  if (image.default?.src) {
    return image.default.src;
  }

  if (image.url) {
    return image.url;
  }

  if (image.default?.url) {
    return image.default.url;
  }

  return "/placeholder.png";
}

function formatOrders(rawOrders: any[]): Order[] {
  return rawOrders.map((order: any) => {
    let items: any[] = [];

    try {
      if (Array.isArray(order.items)) {
        items = order.items;
      } else if (typeof order.items === "string") {
        const parsed = JSON.parse(order.items);

        if (Array.isArray(parsed)) {
          items = parsed;
        }
      }
    } catch (error) {
      console.error("Error parsing order items:", error);
    }

    if (items.length === 0 && order.name) {
      items = [
        {
          name: order.name,
          image: order.image,
          quantity: order.quantity || 1,
          price: order.price || 0,
          description: order.description || "",
        },
      ];
    }

    const formattedItems: OrderItem[] = items.map((item: any) => ({
      name: item.name || "Unknown Product",
      image: getImageUrl(item.image),
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      description: item.description || "",
    }));

    return {
      id: String(order.id),
      items: formattedItems,
      status: order.status || "Processing",
      paymentStatus: order.paymentStatus || "paid",
      price: String(order.price || 0),
      shipping: String(order.shipping || 0),
      tax: String(order.tax || 0),
      total: String(order.total || 0),
    };
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);

  const loadOrders = async (firebaseUser: User) => {
    try {
      if (!firebaseUser) {
        console.error("No Firebase user is currently signed in.");
        setOrders([]);
        setLoading(false);
        return;
      }

      const userId = firebaseUser.uid;

      if (!userId) {
        console.error("Firebase user has no UID.");
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log("Loading orders for Firebase UID:", userId);

      const token = await firebaseUser.getIdToken(true);

      const response = await fetch(
        `/api/orders/get?user_id=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      const responseText = await response.text();

      console.log("Orders API response:", responseText);

      if (!response.ok) {
        console.error(
          "Orders API returned an error:",
          response.status,
          responseText
        );

        setOrders([]);
        setLoading(false);
        return;
      }

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error("Could not parse orders API response:", error);
        setOrders([]);
        setLoading(false);
        return;
      }

      if (!data || !Array.isArray(data.orders)) {
        console.error("Orders API did not return an orders array:", data);
        setOrders([]);
        setLoading(false);
        return;
      }

      const paidOrders = data.orders.filter(
        (order: any) =>
          String(order.paymentStatus || "").toLowerCase() === "paid"
      );

      paidOrders.sort((a: any, b: any) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });

      const formatted = formatOrders(paidOrders);

      console.log("Formatted orders:", formatted);

      setOrders(formatted);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Setting up Firebase auth listener...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Firebase auth state changed:",
        firebaseUser ? firebaseUser.uid : "No user"
      );

      if (firebaseUser) {
        setLoading(true);
        await loadOrders(firebaseUser);
      } else {
        console.error("No Firebase user is currently signed in.");
        setOrders([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const trackOrder = async (orderId: string) => {
    try {
      setTrackingOrder(orderId);

      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        console.error(
          "Cannot track order because no Firebase user is signed in."
        );
        return;
      }

      await loadOrders(firebaseUser);
    } catch (error) {
      console.error("Error tracking order:", error);
    } finally {
      setTrackingOrder(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      const firestoreId = orderId;

      console.log("Cancelling order:", firestoreId);

      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        alert("You must be logged in to cancel an order.");
        return;
      }

      const token = await firebaseUser.getIdToken(true);

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

      console.log("Cancel order response:", responseText);

      if (!response.ok) {
        console.error(
          "Cancel order failed:",
          response.status,
          responseText
        );

        alert("Could not cancel the order.");
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== orderId)
      );

      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Could not cancel the order.");
    }
  };

  if (loading) {
    return (
      <main className={styles.ordersPage}>
        <div className={styles.container}>
          <h1 className={styles.title}>Your Orders</h1>

          <p>Loading your orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.ordersPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Your Orders</h1>

        {orders.length === 0 ? (
          <div className={styles.emptyOrders}>
            <h2>No orders yet</h2>

            <p>
              Once you purchase something from GlowRush, your orders will
              appear here.
            </p>

            <Link href="/" className={styles.shopButton}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <h3 style={{ color: "rgb(219, 255, 148)" }}>
                      {order.id}
                    </h3>

                    <p>
                      Status:{" "}
                      <span>
                        {order.status}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p>
                      Payment:{" "}
                      <span>
                        {order.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>

                <div className={styles.products}>
                  {order.items.map((item, index) => (
                    <div
                      key={`${order.id}-${index}`}
                      className={styles.product}
                      style={{
                        borderBottom:
                          index < order.items.length - 1
                            ? "1px solid rgb(219, 255, 148)"
                            : "none",
                      }}
                    >
                      <div className={styles.productImage}>
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          width={100}
                          height={100}
                          unoptimized
                        />
                      </div>

                      <div className={styles.productInfo}>
                        <h3
                          style={{
                            margin: "0 0 6px 0",
                            color: "yellowgreen",
                          }}
                        >
                          {item.name}
                        </h3>

                        {item.description && (
                          <p
                            style={{
                              margin: "0 0 8px 0",
                              color: "rgb(219, 255, 148)",
                            }}
                          >
                            {item.description}
                          </p>
                        )}

                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "rgb(219, 255, 148)",
                          }}
                        >
                          Quantity:{" "}
                          <span style={{ color: "yellowgreen" }}>
                            {item.quantity}
                          </span>
                        </p>

                        <p
                          style={{
                            margin: 0,
                            color: "rgb(219, 255, 148)",
                          }}
                        >
                          Price:{" "}
                          <span style={{ color: "yellowgreen" }}>
                            ${Number(item.price || 0).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.orderTotals}>
                  <div className={styles.priceInfo}>
                    <span>Subtotal:</span>
                    <span>
                      ${Number(order.price || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className={styles.priceInfo}>
                    <span>Shipping:</span>
                    <span>
                      ${Number(order.shipping || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className={styles.priceInfo}>
                    <span>Tax:</span>
                    <span>
                      ${Number(order.tax || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className={styles.priceInfo}>
                    <strong>Total:</strong>
                    <strong>
                      ${Number(order.total || 0).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className={styles.orderActions}>
                  <button
                    type="button"
                    onClick={() => trackOrder(order.id)}
                    disabled={trackingOrder === order.id}
                    className={styles.trackButton}
                  >
                    {trackingOrder === order.id
                      ? "Tracking..."
                      : "Track Order"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order.id)}
                    className={styles.cancelButton}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
