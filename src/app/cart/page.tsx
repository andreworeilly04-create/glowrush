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

 
  return (
    <div className={styles.cartContainer}>
      <h1>Your Shopping Cart</h1>
          <div className={styles.cartHeaderBar}>
            <span>Item</span>
            <span>Quantity</span>
            <span>Price</span>
          </div>
          
          {/* Placeholder Cart Item with Image, Quantity Input, and Remove Button */}
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
          <div className={styles.cartSummary}>
            <span>Total:${subtotal.toFixed(2)}</span>
          </div>
        <button className={styles.checkoutBtn}>Proceed to Checkout</button>
        </div>
       
  )
}
        
    
 