'use client'
import { use } from 'react'
import { useParams } from 'next/navigation'
import styles from './page.glowstick.module.css'
import productsData from '@/data/glowsticks'
import Image from 'next/image'

interface PageProps {
  params: Promise<{ id: string}>;
}

export default function DetailsPage({ params }: PageProps) {
  
  const resolvedParams = use(params);
    const productId = resolvedParams.id;

    const product = productsData.find((item) => String(item.id) === String(productId))
  
    if (!product) {
      return <div className={styles.notFound}>Product Not Found!</div>
    }
  return (
    <div className={styles.detailsContainer}>
      <button className={styles.backBtn} onClick={() => window.history.back()}>
        &larr; Back
      </button>

      <div className={styles.productLayout}>
        {/* Large Placeholder Image */}
        <div className={styles.imagePlaceholder}>
          <Image className={styles.productImage} src={product.image} alt={product.name} />
        </div>

        {/* Product Information Column */}
        <div className={styles.productInfo}>
          <h1 className={styles.productName}>{product.name}</h1>
          
          <div className={styles.ratingContainer}>
            <span className={styles.stars}>{'⭐'.repeat(product.rating)}</span>
          </div>

          <p className={styles.productDescription}>
           {product.description}
          </p>

          <div className={styles.priceTag}>${product.price.toFixed(2)}</div>

          <button className={styles.addToCartBtn}>Add to Cart</button>
        </div>
      </div>
    </div>
  )
}