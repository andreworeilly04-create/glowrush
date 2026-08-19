'use client'

import styles from './page.glowstick.module.css'

export default function DetailsPage() {
  return (
    <div className={styles.detailsContainer}>
      <button className={styles.backBtn} onClick={() => window.history.back()}>
        &larr; Back
      </button>

      <div className={styles.productLayout}>
        {/* Large Placeholder Image */}
        <div className={styles.imagePlaceholder}>
          Large Product Image
        </div>

        {/* Product Information Column */}
        <div className={styles.productInfo}>
          <h1 className={styles.productName}>Glow Sticks Deluxe</h1>
          
          <div className={styles.ratingContainer}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.ratingText}>(4.8 / 5)</span>
          </div>

          <p className={styles.productDescription}>
            Illuminate your night with our ultra-bright, long-lasting glow sticks. Perfect for parties, camping, and emergency preparedness. Safe, non-toxic, and built to shine for hours.
          </p>

          <div className={styles.priceTag}>$14.99</div>

          <button className={styles.addToCartBtn}>Add to Cart</button>
        </div>
      </div>
    </div>
  )
}