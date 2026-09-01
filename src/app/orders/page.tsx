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

  // ---------------------------------------------------------
  // Format Firestore orders
  // ---------------------------------------------------------

  const formatOrders = (
    databaseOrders: any[]
  ): Order[] => {
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
          "Orders - failed to parse items:",
          error
        );
      }

      const firstItem =
        items.length > 0 ? items[0] : null;

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
          typeof firstItem.image === "string"
        ) {
          image = firstItem.image;
        } else if (
          typeof firstItem.image === "object" &&
          firstItem.image.src
        ) {
          image = firstItem.image.src;
        }
      }

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

  // ---------------------------------------------------------
  // Load orders through SERVER API
  // ---------------------------------------------------------

  const loadOrders = async (
    firebaseUser: any
  ) => {
    try {
      console.log(
        "======================================"
      );

      console.log(
        "ORDERS: Loading orders"
      );

      console.log(
        "Firebase UID:",
        firebaseUser?.uid
      );

      console.log(
        "======================================"
      );

      if (!firebaseUser) {
        console.error(
          "Orders - no Firebase user."
        );

        setOrders([]);
        return;
      }

      // -------------------------------------------------------
      // Get Firebase ID token
      // -------------------------------------------------------

      const token =
        await firebaseUser.getIdToken();

      console.log(
        "Orders - Firebase ID token obtained."
      );

      // -------------------------------------------------------
      // Call server-side orders API
      // -------------------------------------------------------

      const response = await fetch(
        "/api/orders/get",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          cache: "no-store",
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
          "Orders - server returned invalid JSON:",
          text
        );

        return;
      }

      console.log(
        "Orders API response:",
        data
      );

      if (!response.ok) {
        console.error(
          "Orders API error:",
          data?.error
        );

        setOrders([]);
        return;
      }

      if (!data.success) {
        console.error(
          "Orders API failed:",
          data?.error
        );

        setOrders([]);
        return;
      }

      const databaseOrders =
        Array.isArray(data.orders)
          ? data.orders
          : [];

      console.log(
        "Orders received:",
        databaseOrders.length
      );

      // -------------------------------------------------------
      // Only show paid orders
      // -------------------------------------------------------

      const paidOrders =
        databaseOrders.filter(
          (order: any) => {
            const paymentStatus =
              String(
                order.paymentStatus || ""
              )
                .trim()
                .toLowerCase();

            return (
              paymentStatus === "paid"
            );
          }
        );

      console.log(
        "Paid orders:",
        paidOrders.length
      );

      // -------------------------------------------------------
      // Sort newest first
      // -------------------------------------------------------

      paidOrders.sort(
        (a: any, b: any) => {
          const dateA = new Date(
            a.createdAt || 0
          ).getTime();

          const dateB = new Date(
            b.createdAt || 0
          ).getTime();

          return dateB - dateA;
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
        "Formatted orders:",
        formattedOrders
      );

      setOrders(
        formattedOrders
      );
    } catch (error: any) {
      console.error(
        "======================================"
      );

      console.error(
        "ORDERS LOAD ERROR:",
        error
      );

      console.error(
        "Error message:",
        error?.message
      );

      console.error(
        "======================================"
      );

      setOrders([]);
    }
  };

  // ---------------------------------------------------------
  // Watch Firebase authentication
  // ---------------------------------------------------------

  useEffect(() => {
    console.log(
      "Orders - waiting for Firebase authentication..."
    );

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          try {
            if (!firebaseUser) {
              console.warn(
                "Orders - no Firebase user is signed in."
              );

              setOrders([]);
              setLoading(false);

              return;
            }

            console.log(
              "======================================"
            );

            console.log(
              "ORDERS: Firebase user authenticated"
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

            await loadOrders(
              firebaseUser
            );
          } catch (error) {
            console.error(
              "Orders - authentication error:",
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

  // ---------------------------------------------------------
  // Track / refresh order
  // ---------------------------------------------------------

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
          "Orders - cannot track order because no Firebase user is signed in."
        );

        return;
      }

      await loadOrders(
        firebaseUser
      );
    } catch (error) {
      console.error(
        "Orders - failed to refresh orders:",
        error
      );
    } finally {
      setTrackingOrder(null);
    }
  };

  // ---------------------------------------------------------
  // Cancel order
  // ---------------------------------------------------------

  const handleCancelOrder =
    async (
      orderId: string
    ) => {
      try {
        const firestoreId =
          orderId.startsWith("ORD-")
            ? orderId.substring(4)
            : orderId;

        const firebaseUser =
          auth.currentUser;

        if (!firebaseUser) {
          console.error(
            "Orders - cannot cancel order because no Firebase user is signed in."
          );

          return;
        }

        const token =
          await firebaseUser.getIdToken();

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
            ? JSON.parse(text)
            : {};
        } catch {
          console.error(
            "Orders - invalid delete response:",
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
            "Orders - failed to cancel order:",
            data?.error
          );
        }
      } catch (error) {
        console.error(
          "Orders - cancel order error:",
          error
        );
      }
    };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

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
      ) : orders.length === 0 ? (
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
                      {
                        order.status
                      }
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