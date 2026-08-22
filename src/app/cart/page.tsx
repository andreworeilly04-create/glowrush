'use client'
import { useCart } from "@/context/context"
import Image from "next/image"
import Link from "next/link"
import styles from './page.cart.module.css'

export default function CartPage() {

  const { cart, removefromCart, updateQuantity } = useCart();

  const removeItem = (id: string | number) => {
    removefromCart(id);
 };

 const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);
 const shipping = subtotal > 0 ? 5.00 : 0.00;
 const tax = subtotal * 0.07; // 7% tax rate calculation
 const total = subtotal + shipping + tax;

  return (
    <div className={styles.cartContainer}>
      <h1>Your Shopping Cart</h1>
          <div className={styles.cartHeaderBar}>
            <span>Item</span>
            <span>Quantity</span>
            <span>Price</span>
          </div>
          
         {cart.length === 0 ? (
        <div className={styles.emptyCart}>
          <p>You don't have any items in your cart.</p>
          <Link href="/glowsticks">
            <button className={styles.shopGlowSticksBtn}>Shop Glow Sticks</button>
          </Link>
        </div>
      ) : (
        
         <div className={styles.cartList}>
          {cart.map((item: any, index: number) => (
          <div key={index} className={styles.cartItem}>
            <div className={styles.itemInfo}>
              <Image src={item.image} className={styles.imagePlaceholder} alt={item.name} width={60} height={60} />
              <div className={styles.itemDetails}>
                <h3>{item.name}</h3>
                <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            </div>
            <div className={styles.itemQuantityContainer}>
              <input 
                type="number" 
                min="1" 
                value={item.quantity || 1}
                onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                className={styles.quantityInput} 
              />
            </div>
            <div className={styles.itemPrice}>${item.price}</div>
            </div>
            ))}
          </div>
          )}

          {cart.length > 0 && (
            <div className={styles.summaryWrapper}>
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
              <div className={styles.cartSummary}>
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}

        <Link className={styles.checkoutLink} href="/checkout"><button className={styles.checkoutBtn}>Proceed to Checkout</button></Link>
    </div>
  )
}


        
    
 