"use client";
import React, { useState } from "react";
import { useCart } from "@/context/context";
import styles from "./page.checkout.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { cart } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "card",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (method: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const subtotal = cart.reduce((total: number, item: any) => {
    const price = item.price || 0;
    const qty = item.quantity || 1;
    return total + price * qty;
  }, 0);

  const shipping = subtotal > 0 ? 5.00 : 0.00;
  const tax = subtotal * 0.07;
  const total = subtotal + shipping + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Order placed successfully!");
    router.push("/");
  };

  if (cart.length === 0) {
    return (
      <div className={styles.checkoutContainer}>
        <div className={styles.emptyState}>
          <h2>Your cart is empty!</h2>
          <p style={{ margin: "15px 0" }}>Add some glowsticks before heading to checkout.</p>
          <Link href="/glowsticks" className={styles.placeOrderBtn} style={{ display: "inline-block", textDecoration: "none", textAlign: "center", width: "auto", padding: "10px 20px" }}>
            Browse Glow Sticks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.checkoutTitle}>Checkout</h1>

      <form onSubmit={handleSubmit} className={styles.checkoutGrid}>
        {/* Left Column: Delivery Information & Payment Options */}
        <div className={styles.checkoutForm}>
          <h2 className={styles.sectionTitle}>Delivery Information</h2>

          <div className={styles.formGroup}>
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              required
              className={styles.formInput}
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Andrew Smith"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className={styles.formInput}
              value={formData.email}
              onChange={handleChange}
              placeholder="andrew@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className={styles.formInput}
              value={formData.phone}
              onChange={handleChange}
              placeholder="(352) 555-0199"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address">Street Address</label>
            <input
              type="text"
              id="address"
              name="address"
              required
              className={styles.formInput}
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Glow Street"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div className={styles.formGroup}>
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                required
                className={styles.formInput}
                value={formData.city}
                onChange={handleChange}
                placeholder="Gainesville"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                required
                className={styles.formInput}
                value={formData.state}
                onChange={handleChange}
                placeholder="FL"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="zipCode">Zip Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                required
                className={styles.formInput}
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="32601"
              />
            </div>
          </div>

          <h2 className={styles.sectionTitle} style={{ marginTop: "10px" }}>Payment Method</h2>
          <div className={styles.paymentOptions}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={formData.paymentMethod === "card"}
                onChange={() => handlePaymentChange("card")}
              />
              Credit Card
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={formData.paymentMethod === "cash"}
                onChange={() => handlePaymentChange("cash")}
              />
              Cash on Delivery
            </label>
          </div>
        </div>

        {/* Right Column: Order Summary with Images, Prices, Quantities & Totals */}
        <div className={styles.summaryColumn}>
          <h2 className={styles.sectionTitle}>Order Summary</h2>
          <div className={styles.summaryList}>
            {cart.map((item: any, index: number) => {
              const itemQuantity = item.quantity || 1;
              const itemPrice = item.price || 0;
              return (
                <div key={item.id || index} className={styles.summaryItem}>
                  <div className={styles.itemImageWrapper}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={60}
                      height={60}
                      className={styles.itemImage}
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <span className={styles.itemMeta}>Qty: {itemQuantity}</span>
                    <span className={styles.itemMeta}>${(itemPrice * itemQuantity).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.summaryBreakdown}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping:</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Estimated Tax (7%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.totalSection}>
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button type="submit" className={styles.placeOrderBtn}>
            Place Order
          </button>
        </div>
      </form>
    </div>
  );
}
