"use client";

import {
  useEffect,
  useState,
} from "react";
import styles from "./page.orders.module.css";
import Image from "next/image";
import Link from "next/link";

type Order = {
  id: string;
  name: string;
  image: string;
  status: string;
  price: string;
  shipping: string;
  tax: string;
  total: string;
};

export default function OrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [trackingOrder, setTrackingOrder] =
    useState<string | null>(null);

  // --------------------------------------------------
  // Get logged-in user's ID
  // --------------------------------------------------
  const getUserId = (): string | null => {
    try {
      const rawUser =
        localStorage.getItem("user");

      console.log(
        "Orders - localStorage user:",
        rawUser
      );

      if (
        !rawUser ||
        rawUser === "undefined" ||
        rawUser === "null"
      ) {
        return null;
      }

      const currentUser =
        JSON.parse(rawUser);

      console.log(
        "Orders - parsed user:",
        currentUser
      );

      const userId =
        currentUser?.user_id ||
        currentUser?.id ||
        currentUser?.uid ||
        null;

      console.log(
        "Orders - user ID:",
        userId
      );

      if (!userId) {
        return null;
      }

      return String(userId);
    } catch (error) {
      console.error(
        "Orders - failed to read user:",
        error
      );

      return null;
    }
  };

  // --------------------------------------------------
  // Format orders
  // --------------------------------------------------
  const formatOrders = (
    databaseOrders: any[]
  ): Order[] => {
    return databaseOrders.map(
      (order: any) => {
        let items: any[] = [];

        try {
          if (
            Array.isArray(order.items)
          ) {
            items = order.items;
          } else if (
            typeof order.items ===
              "string" &&
            order.items.trim() !== ""
          ) {
            items = JSON.parse(
              order.items
            );
          }
        } catch (error) {
          console.error(
            "Could not parse order items:",
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
                      item?.quantity || 1
                    })`
                )
                .join(", ")
            : "GlowRush Order";

        return {
          id: `ORD-${order.id}`,

          name,

          image:
            firstItem?.image || "",

          status:
            order.status ||
            "Paid / Processing",

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
      }
    );
  };

  // --------------------------------------------------
  // Fetch orders
  // --------------------------------------------------
  const loadOrders = async (
    userId: string
  ) => {
    try {
      console.log(
        "Orders - fetching orders for:",
        userId
      );

      const response = await fetch(
        `/api/orders/get?user_id=${encodeURIComponent(
          userId
        )}&t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control":
              "no-cache",
          },
        }
      );

      const text =
        await response.text();

      let data: any;

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        console.error(
          "Orders - API returned invalid JSON:",
          text
        );

        throw new Error(
          "Invalid response from orders API"
        );
      }

      console.log(
        "Orders - API response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to load orders"
        );
      }

      if (
        data.success &&
        Array.isArray(data.orders)
      ) {
        const formattedOrders =
          formatOrders(data.orders);

        console.log(
          "Orders - found:",
          formattedOrders
        );

        setOrders(
          formattedOrders
        );
      } else {
        console.warn(
          "Orders - no orders found:",
          data?.error
        );

        setOrders([]);
      }
    } catch (error) {
      console.error(
        "Orders - fetch error:",
        error
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Load orders when page opens
  // --------------------------------------------------
  useEffect(() => {
    const userId =
      getUserId();

    if (!userId) {
      console.warn(
        "Orders page cannot load orders because no user ID was found."
      );

      setOrders([]);
      setLoading(false);

      return;
    }

    loadOrders(userId);
  }, []);

  // --------------------------------------------------
  // Track / refresh order
  // --------------------------------------------------
  const trackOrder = async (
    orderId: string
  ) => {
    try {
      setTrackingOrder(orderId);

      const userId =
        getUserId();

      if (!userId) {
        console.error(
          "Cannot track order because no user ID was found."
        );

        return;
      }

      await loadOrders(userId);
    } catch (error) {
      console.error(
        "Failed to track order:",
        error
      );
    } finally {
      setTrackingOrder(null);
    }
  };

  // --------------------------------------------------
  // Cancel order
  // --------------------------------------------------
  const handleCancelOrder =
    async (orderId: string) => {
      try {
        const firestoreId =
          orderId.startsWith(
            "ORD-"
          )
            ? orderId.substring(4)
            : orderId;

        const response =
          await fetch(
            "/api/orders/delete",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
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
            ? JSON.parse(text)
            : {};
        } catch {
          console.error(
            "Invalid delete response:",
            text
          );

          return;
        }

        if (data.success) {
          setOrders(
            (previousOrders) =>
              previousOrders.filter(
                (order) =>
                  order.id !==
                  orderId
              )
          );
        } else {
          console.error(
            "Failed to cancel order:",
            data?.error
          );
        }
      } catch (error) {
        console.error(
          "Cancel order error:",
          error
        );
      }
    };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div
      className={styles.container}
    >
      <h1
        className={styles.title}
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
      ) : orders.length === 0 ? (
        <div
          className={
            styles.emptyState
          }
        >
          <p>
            No active orders found.
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
                key={order.id}
                className={
                  styles.orderCard
                }
              >
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
                      {order.name}
                    </h3>

                    <span
                      className={
                        styles.statusBadge
                      }
                    >
                      Status:{" "}
                      {order.status}
                    </span>
                  </div>
                </div>

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
                      {order.tax}
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

