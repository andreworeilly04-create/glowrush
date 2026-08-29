"use client";
import { useState, useEffect } from "react";
import styles from "./page.orders.module.css";
import Image from "next/image";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("recent_order");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const shippingInfo = JSON.parse(
      localStorage.getItem("shipping_address") || "{}",
    );
    const userId = currentUser.user_id || currentUser.id || null;

    const loadOrders = (currentUserId: any) => {
      if (!currentUserId) return;
      fetch(`/api/orders/get?user_id=${currentUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.orders) {
            const formattedOrders = data.orders.map((o: any) => {
              let parsedItems = [];
              try {
                parsedItems =
                  typeof o.items === "string" ? JSON.parse(o.items) : o.items;
              } catch (e) {
                parsedItems = [];
              }
              return {
                id: `ORD-${o.id}`,
                name: Array.isArray(parsedItems)
                  ? parsedItems
                      .map((i: any) => `${i.name} (Quantity: ${i.quantity || 1})`)
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
            
            setOrders((prevOrders) => {
              const tempOrders = prevOrders.filter((o) => typeof o.id === "string" && o.id.includes("-") && parseInt(o.id.replace("ORD-", "")) > 999);
              const combined = [...tempOrders, ...formattedOrders];
              return Array.from(new Map(combined.map(item => [item.id, item])).values());
            });
          }
        })
        .catch((err) => console.error("Failed to fetch orders:", err));
    };

    if (savedCart) {
      const parsedOrder = JSON.parse(savedCart);
      const safeItems = Array.isArray(parsedOrder.items) ? parsedOrder.items : [];
      
      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: safeItems
          .map((i: any) => `${i.name} (Quantity: ${i.quantity || 1})`)
          .join(", "),
        image: safeItems[0]?.image || "",
        status: parsedOrder.status || 'Paid / Processing',
        price: `$${Number(parsedOrder.price || 0).toFixed(2)}`,
        shipping: `$${Number(parsedOrder.shipping || 0).toFixed(2)}`,
        tax: `$${Number(parsedOrder.tax || 0).toFixed(2)}`,
        total: `$${Number(parsedOrder.total || 0).toFixed(2)}`,
      };

      setOrders(prevOrders => [newOrder, ...prevOrders]);
      localStorage.removeItem("recent_order");

      fetch("/api/orders/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsedOrder,
          user_id: userId,
          customerEmail: parsedOrder.customerEmail || "N/A",
          shippingAddress: shippingInfo.address || parsedOrder.shippingAddress || "N/A",
          phone: parsedOrder.phone || "N/A",
        }),
      })
        .then((res) => res.json())
        .then(() => {
          if (userId) loadOrders(userId);
        })
        .catch((err) => console.error("Failed to save to db:", err));
    } else {
      loadOrders(userId);
    }
  }, []);

  const handleCancelOrder = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId),
    );
  };

  const updateOrderStatus = async (fullOrderId: string, newStatus: string) => {
    try {
      const numericId = fullOrderId.replace(/[^0-9]/g, "");
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ id: numericId, status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === fullOrderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Orders</h1>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No active orders found.</p>
          <Link href="/shop" className={styles.shopGlowBtn}>
            Shop Glow Sticks
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
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
                <div className={styles.buttonGroup}>
                  <button onClick={() => updateOrderStatus(order.id, 'Shipped')} className={styles.trackBtn}>Track Order</button>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}