"use client";
import { useState, useEffect } from "react";
import styles from "./page.orders.module.css";
import Image from "next/image";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);

  // Format orders from database
  const formatOrders = (databaseOrders: any[]) => {
    return databaseOrders.map((o: any) => {
      let parsedItems: any[] = [];

      try {
        parsedItems =
          typeof o.items === "string"
            ? JSON.parse(o.items)
            : o.items || [];
      } catch (e) {
        console.error("Failed to parse order items:", e);
        parsedItems = [];
      }

      return {
        id: `ORD-${o.id}`,
        name: Array.isArray(parsedItems)
          ? parsedItems
              .map(
                (i: any) =>
                  `${i.name} (Quantity: ${i.quantity || 1})`
              )
              .join(", ")
          : "",
        image: parsedItems[0]?.image || "",
        status: o.status || "Paid / Processing",
        price: `$${Number(o.price || 0).toFixed(2)}`,
        shipping: `$${Number(o.shipping || 0).toFixed(2)}`,
        tax: `$${Number(o.tax || 0).toFixed(2)}`,
        total: `$${Number(o.total || 0).toFixed(2)}`,
      };
    });
  };

  // Load orders from MySQL
  const loadOrders = async (userId: any) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/orders/get?user_id=${userId}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (data.success && data.orders) {
        const formattedOrders = formatOrders(data.orders);
        setOrders(formattedOrders);
      } else {
        console.error("Failed to load orders:", data.error);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeOrders = async () => {
      try {
        const savedCart = localStorage.getItem("recent_order");

        const currentUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        const shippingInfo = JSON.parse(
          localStorage.getItem("shipping_address") || "{}"
        );

        const userId =
          currentUser.user_id ||
          currentUser.id ||
          null;

        // If there is a recent order waiting to be saved
        if (savedCart) {
          try {
            const parsedOrder = JSON.parse(savedCart);

            // Remove it so it isn't saved multiple times
            localStorage.removeItem("recent_order");

            const saveResponse = await fetch("/api/orders/save", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...parsedOrder,
                user_id: userId,
                customerEmail:
                  parsedOrder.customerEmail || "N/A",
                shippingAddress:
                  shippingInfo.address ||
                  parsedOrder.shippingAddress ||
                  "N/A",
                phone: parsedOrder.phone || "N/A",
              }),
            });

            const saveData = await saveResponse.json();

            if (!saveData.success) {
              console.error(
                "Failed to save order:",
                saveData.error
              );
            }
          } catch (err) {
            console.error(
              "Failed to process recent order:",
              err
            );
          }
        }

        // Load the latest orders from MySQL
        if (userId) {
          await loadOrders(userId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(
          "Failed to initialize orders:",
          err
        );
        setLoading(false);
      }
    };

    initializeOrders();
  }, []);

  // Track Order
  // This gets the newest status from MySQL
  const trackOrder = async (orderId: string) => {
    try {
      setTrackingOrder(orderId);

      const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const userId =
        currentUser.user_id ||
        currentUser.id ||
        null;

      if (!userId) {
        console.error("No user ID found.");
        return;
      }

      // Fetch latest orders from database
      const res = await fetch(
        `/api/orders/get?user_id=${userId}&t=${Date.now()}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (data.success && data.orders) {
        const formattedOrders = formatOrders(data.orders);

        setOrders(formattedOrders);

        // Find the specific order we just tracked
        const updatedOrder = formattedOrders.find(
          (order: any) =>
            String(order.id) === String(orderId)
        );

        if (updatedOrder) {
          console.log(
            `Order ${orderId} status:`,
            updatedOrder.status
          );
        }
      } else {
        console.error(
          "Failed to refresh order:",
          data.error
        );
      }
    } catch (err) {
      console.error(
        "Failed to track order:",
        err
      );
    } finally {
      setTrackingOrder(null);
    }
  };

  // Cancel order from the page
  const handleCancelOrder = async (orderId: string) => {
    try {
      const numericId = orderId.replace(/[^0-9]/g, "");
      const res = await fetch('/api/orders/delete', {
        method: "POST",
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ id: numericId })
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prevOrders) => 
        prevOrders.filter((order) => order.id !== orderId)
      )
    }
  } catch (err) {
    console.error("Failed to cancel order:", err);
  }
};
   
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Your Orders
      </h1>

      {loading ? (
        <div className={styles.emptyState}>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No active orders found.</p>

          <Link
            href="/glowsticks"
            className={styles.shopGlowBtn}
          >
            Shop Glow Sticks
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div
              key={order.id}
              className={styles.orderCard}
            >
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

                  <span
                    className={
                      styles.statusBadge
                    }
                  >
                    Status: {order.status}
                  </span>
                </div>
              </div>

              <div className={styles.orderRight}>
                <div
                  className={styles.priceInfo}
                >
                  Price:{" "}
                  <span>{order.price}</span>
                </div>

                <div
                  className={styles.priceInfo}
                >
                  Shipping:{" "}
                  <span>{order.shipping}</span>
                </div>

                <div
                  className={styles.priceInfo}
                >
                  Tax:{" "}
                  <span>{order.tax}</span>
                </div>

                <div
                  className={styles.priceInfo}
                >
                  Total:{" "}
                  <span>{order.total}</span>
                </div>

                <div
                  className={styles.buttonGroup}
                >
                  {/* TRACK ORDER */}
                  <button
                    onClick={() =>
                      trackOrder(order.id)
                    }
                    className={styles.trackBtn}
                    disabled={
                      trackingOrder === order.id
                    }
                  >
                    {trackingOrder === order.id
                      ? "Checking..."
                      : "Track Order"}
                  </button>

                  {/* CANCEL ORDER */}
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
          ))}
        </div>
      )}
    </div>
  );
}

