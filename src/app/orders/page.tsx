
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.orders.module.css";
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
  createdAt: any;
  shippingAddress?: any;
  shippingTime?: string;
  estimatedDelivery?: string;
};

const getImageUrl = (image: any): string => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    if (typeof image.src === "string") return image.src;
    if (typeof image.default?.src === "string") return image.default.src;
    if (typeof image.url === "string") return image.url;
    if (typeof image.default?.url === "string") return image.default.url;
  }

  return "";
};

const formatShippingAddress = (address: any) => {
  if (!address) {
    return null;
  }

  if (typeof address === "string") {
    return {
      line1: address,
      line2: "",
      city: "",
      state: "",
      zip: "",
    };
  }

  return {
    line1:
      address.line1 ||
      address.address ||
      address.street ||
      address.addressLine1 ||
      "",
    line2:
      address.line2 ||
      address.apartment ||
      address.unit ||
      address.addressLine2 ||
      "",
    city: address.city || "",
    state: address.state || address.province || "",
    zip:
      address.zip ||
      address.zipCode ||
      address.postalCode ||
      "",
  };
};

const formatOrderDate = (createdAt: any): string => {
  if (!createdAt) return "Date unavailable";

  try {
    let date: Date;

    if (
      typeof createdAt === "object" &&
      typeof createdAt.toDate === "function"
    ) {
      date = createdAt.toDate();
    } else if (
      typeof createdAt === "object" &&
      typeof createdAt.seconds === "number"
    ) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }

    if (isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Date unavailable";
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatOrders = (rawOrders: any[]): Order[] => {
    return rawOrders.map((order: any) => {
      let parsedItems: any[] = [];

      try {
        if (Array.isArray(order.items)) {
          parsedItems = order.items;
        } else if (typeof order.items === "string") {
          parsedItems = JSON.parse(order.items);
        }
      } catch (error) {
        console.error("Could not parse order items:", error);
        parsedItems = [];
      }

      const items: OrderItem[] = parsedItems.map((item: any) => ({
        name: item.name || "GlowRush Product",
        image: getImageUrl(item.image || item.img || item.src),
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        description: item.description || "",
      }));

      return {
        id: `ORD-${order.id}`,
        items,
        status: order.status || "Paid / Processing",
        paymentStatus: order.paymentStatus || "",
        price: `$${Number(order.price || 0).toFixed(2)}`,
        shipping: `$${Number(order.shipping || 0).toFixed(2)}`,
        tax: `$${Number(order.tax || 0).toFixed(2)}`,
        total: `$${Number(order.total || 0).toFixed(2)}`,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress || null,
        shippingTime: order.shippingTime || "3–5 business days",
        estimatedDelivery:
          order.estimatedDelivery ||
          "3–5 business days after shipment",
      };
    });
  };

  const loadOrders = async (firebaseUser: any) => {
    if (!firebaseUser) {
      console.error("Orders page cannot load orders because no user ID was found.");
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const userId = firebaseUser.uid;

      if (!userId) {
        console.error("Orders page cannot load orders because no user ID was found.");
        setOrders([]);
        return;
      }

      const token = await firebaseUser.getIdToken(true);

      const response = await fetch(
        `/api/orders/get?user_id=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();

      console.log("Orders API response:", data);

      const rawOrders = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : [];

      const paidOrders = rawOrders.filter(
        (order: any) => order.paymentStatus === "paid"
      );

      paidOrders.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });

      const formattedOrders = formatOrders(paidOrders);

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        loadOrders(firebaseUser);
      } else {
        console.error("No Firebase user is currently signed in.");
        setOrders([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const trackOrder = async (orderId: string) => {
    try {
      setTrackingOrder(orderId);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("No Firebase user is currently signed in.");
        return;
      }

      await loadOrders(currentUser);
    } catch (error) {
      console.error("Error tracking order:", error);
    } finally {
      setTrackingOrder(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("No Firebase user is currently signed in.");
        return;
      }

      const token = await currentUser.getIdToken(true);

      let orderId = cancelOrderId;

      if (orderId.startsWith("ORD-")) {
        orderId = orderId.substring(4);
      }

      const response = await fetch("/api/orders/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: orderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrders((previousOrders) =>
          previousOrders.filter((order) => order.id !== cancelOrderId)
        );
      } else {
        console.error("Failed to cancel order:", data);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setCancelOrderId(null);
    }
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>My Orders</h1>
        <div className={styles.emptyState}>
          <p>Loading orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>My Orders</h1>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No completed orders found.</p>

          <Link href="/glowsticks" className={styles.shopGlowBtn}>
            Shop GlowSticks
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div className={styles.orderCard} key={order.id}>
              <div className={styles.orderLeft}>
                <div className={styles.orderDetails}>
                  <p className={styles.orderDate}>
                    Order Date:{" "}
                    <span>{formatOrderDate(order.createdAt)}</span>
                  </p>

                  <span
                    className={`${styles.statusBadge} ${styles.statusBadgeNoWrap}`}
                  >
                    Status: {order.status}
                  </span>
                </div>
              </div>

              <div className={styles.itemsContainer}>
                {order.items.map((item, index) => (
                  <div
                    key={`${order.id}-${index}`}
                    className={`${styles.orderItem} ${
                      index < order.items.length - 1
                        ? styles.orderItemWithBorder
                        : ""
                    }`}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className={styles.productImg}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.noImage}>
                        No image
                      </div>
                    )}

                    <div className={styles.itemInfo}>
                      <h3>{item.name}</h3>

                      <p className={styles.quantityText}>
                        Quantity: <span>{item.quantity}</span>
                      </p>

                      <p className={styles.itemPrice}>
                        Price:{" "}
                        <span>
                          ${Number(item.price || 0).toFixed(2)}
                        </span>
                      </p>

                      {item.description && (
                        <p className={styles.itemDescription}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.orderRight}>
                <div className={styles.priceInfo}>
                  Total: <span>{order.total}</span>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={styles.detailsBtn}
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Order Details
                  </button>

                  <button
                    type="button"
                    className={styles.trackBtn}
                    onClick={() => trackOrder(order.id)}
                    disabled={trackingOrder === order.id}
                  >
                    {trackingOrder === order.id
                      ? "Refreshing..."
                      : "Track Order"}
                  </button>

                  {order.status === "Paid / Processing" && (
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setCancelOrderId(order.id)}
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

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          className={styles.detailsModalOverlay}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className={styles.detailsModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.detailsHeader}>
              <h2>Order Details</h2>

              <button
                type="button"
                className={styles.closeDetailsBtn}
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                ×
              </button>
            </div>

            <div className={styles.detailsSection}>
              <h3>Shipping Information</h3>

              <div className={styles.detailsRow}>
                <span>Order Date</span>
                <strong>
                  {formatOrderDate(selectedOrder.createdAt)}
                </strong>
              </div>

              <div className={styles.detailsRow}>
                <span>Status</span>
                <strong>{selectedOrder.status}</strong>
              </div>

              <div className={styles.shippingAddress}>
                <span>Shipping Address</span>

                <div>
                  {(() => {
                    const address = formatShippingAddress(
                      selectedOrder.shippingAddress
                    );

                    if (!address) {
                      return <p>Address unavailable</p>;
                    }

                    return (
                      <>
                        {address.line1 && (
                          <p>{address.line1}</p>
                        )}

                        {address.line2 && (
                          <p>{address.line2}</p>
                        )}

                        {(address.city ||
                          address.state ||
                          address.zip) && (
                          <p>
                            {address.city}
                            {address.city &&
                            address.state
                              ? ", "
                              : ""}
                            {address.state}
                            {(address.city ||
                              address.state) &&
                            address.zip
                              ? " "
                              : ""}
                            {address.zip}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className={styles.detailsRow}>
                <span>Shipping Time</span>
                <strong>
                  {selectedOrder.shippingTime ||
                    "3–5 business days"}
                </strong>
              </div>

              <div className={styles.detailsRow}>
                <span>Estimated Delivery</span>
                <strong>
                  {selectedOrder.estimatedDelivery ||
                    "3–5 business days after shipment"}
                </strong>
              </div>
            </div>

            <div className={styles.detailsSection}>
              <h3>Order Summary</h3>

              {selectedOrder.items.map((item, index) => (
                <div
                  className={styles.detailsProduct}
                  key={`${selectedOrder.id}-details-${index}`}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <strong>
                    $
                    {(
                      Number(item.price || 0) *
                      Number(item.quantity || 0)
                    ).toFixed(2)}
                  </strong>
                </div>
              ))}

              <div className={styles.detailsTotalRow}>
                <span>Subtotal</span>
                <strong>{selectedOrder.price}</strong>
              </div>

              <div className={styles.detailsTotalRow}>
                <span>Shipping</span>
                <strong>{selectedOrder.shipping}</strong>
              </div>

              <div className={styles.detailsTotalRow}>
                <span>Tax</span>
                <strong>{selectedOrder.tax}</strong>
              </div>

              <div className={styles.detailsGrandTotal}>
                <span>Total</span>
                <strong>{selectedOrder.total}</strong>
              </div>
            </div>

            <button
              type="button"
              className={styles.closeDetailsButton}
              onClick={() => setSelectedOrder(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelOrderId && (
        <div
          className={styles.cancelModalOverlay}
          onClick={() => setCancelOrderId(null)}
        >
          <div
            className={styles.cancelModal}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Cancel Order?</h2>

            <p>
              Are you sure you want to cancel this order?
              This action cannot be undone.
            </p>

            <div className={styles.cancelModalButtons}>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={handleCancelOrder}
              >
                Yes, Cancel Order
              </button>

              <button
                type="button"
                className={styles.keepOrderBtn}
                onClick={() => setCancelOrderId(null)}
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

