"use client";

import {
  useEffect,
  useState,
} from "react";

import styles from "./page.orders.module.css";
import Image from "next/image";
import Link from "next/link";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

import { auth, db } from "@/lib/db";

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
  // Format Firestore orders
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
  // Load orders directly from Firebase
  // --------------------------------------------------

  const loadOrders = async (
    userId: string
  ) => {
    try {
      console.log(
        "Orders - loading Firebase orders for UID:",
        userId
      );

      const ordersRef =
        collection(db, "orders");

      const q = query(
        ordersRef,
        where(
          "user_id",
          "==",
          userId
        )
      );

      const querySnapshot =
        await getDocs(q);

      console.log(
        "Orders - Firebase documents found:",
        querySnapshot.size
      );

      const databaseOrders =
        querySnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

      /*
       * Sort newest orders first.
       *
       * We do this in JavaScript instead
       * of requiring a Firestore index.
       */
      databaseOrders.sort(
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

      const formattedOrders =
        formatOrders(
          databaseOrders
        );

      console.log(
        "Orders - formatted orders:",
        formattedOrders
      );

      setOrders(
        formattedOrders
      );
    } catch (error) {
      console.error(
        "Orders - Firebase fetch error:",
        error
      );

      setOrders([]);
    }
  };

  // --------------------------------------------------
  // Watch Firebase authentication
  // --------------------------------------------------

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
              "Orders - Firebase user:",
              firebaseUser
            );

            console.log(
              "Orders - Firebase UID:",
              firebaseUser.uid
            );

            await loadOrders(
              firebaseUser.uid
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

  // --------------------------------------------------
  // Track / refresh order
  // --------------------------------------------------

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
          "Cannot track order because no Firebase user is signed in."
        );

        return;
      }

      await loadOrders(
        firebaseUser.uid
      );
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

