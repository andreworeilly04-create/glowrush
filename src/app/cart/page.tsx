'use client'

import styles from './page.cart.module.css'

export default function CartPage() {
  // Toggle this to test empty state
  const cartItems = [
    { id: 1, name: 'Placeholder Product Item', price: 29.99, quantity: 1 }
  ];

  return (
    <div className={styles.cartContainer}>
      <h1>Your Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <p>You don't have any items in your cart.</p>
          <button className={styles.cta_btn}>Shop Glow Sticks</button>
        </div>
      ) : (
        <>
          {/* Yellowgreen bar on top of the item */}
          <div className={styles.cartHeaderBar}>
            <span>Item</span>
            <span>Quantity</span>
            <span>Price</span>
          </div>
          
          {/* Placeholder Cart Item with Image, Quantity Input, and Remove Button */}
          <div className={styles.cartItem}>
            <div className={styles.itemInfo}>
              <div className={styles.imagePlaceholder}>Img</div>
              <div className={styles.itemDetails}>
                <h3>Placeholder Product Item</h3>
                <button className={styles.removeBtn}>Remove</button>
              </div>
            </div>
            <div className={styles.itemQuantityContainer}>
              <input 
                type="number" 
                min="1" 
                defaultValue="1" 
                className={styles.quantityInput} 
              />
            </div>
            <div className={styles.itemPrice}>$29.99</div>
          </div>

          <div className={styles.cartSummary}>
            <span>Total:</span>
            <span>$29.99</span>
          </div>

          <button className={styles.checkoutBtn}>Proceed to Checkout</button>
        </>
      )}
    </div>
  )
}