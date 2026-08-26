'use client'
import styles from './page.orders.module.css';

export default function OrdersPage() {
  const orders = [
    {
      id: 'ORD-2026-01',
      name: 'GlowRush Product Item',
      status: 'Out for Delivery',
      total: '$49.99',
    },
    {
      id: 'ORD-2026-02',
      name: 'Featured Item Bundle',
      status: 'Processing',
      total: '$85.00',
    },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Orders</h1>

      <div className={styles.ordersList}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderLeft}>
              <div className={styles.productImg}>Image Placeholder</div>
              <div className={styles.orderDetails}>
                <h3>{order.name}</h3>
                <span className={styles.statusBadge}>Status: {order.status}</span>
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