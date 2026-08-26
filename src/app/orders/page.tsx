"use client";
import { useState, useEffect } from "react";
import styles from "./page.orders.module.css";
import Image from "next/image";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("success") === "true") {
      const savedCart = localStorage.getItem("recent_order");

      if (savedCart) {
        const parsedOrder = JSON.parse(savedCart);

        const newOrder = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          name: parsedOrder.items
            .map((i: any) => `${i.name} (Quantity: ${i.quantity || 1})`)
            .join(", "),
          image: parsedOrder.items[0]?.image || "",
          status: "Paid / Processing",
          total: `$${parsedOrder.total.toFixed(2)}`,
        };

        setOrders([newOrder]);
        localStorage.removeItem("recent_order");
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Orders</h1>

      <div className={styles.ordersList}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderLeft}>
              {order.image && (
                <Image
                  src={order.image}
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
                Total: <span>{order.total}</span>
              </div>
              <button className={styles.trackBtn}>Track Order</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
