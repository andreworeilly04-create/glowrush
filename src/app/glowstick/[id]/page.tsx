"use client";
import { use } from "react";
import { useCart } from "@/context/context";
import { useRouter } from "next/navigation";
import styles from "./page.glowstick.module.css";
import productsData from "@/data/glowsticks";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetailsPage({ params }: PageProps) {
  const { addToCart } = useCart();
  const router = useRouter();

  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const glowstick = productsData.find(
    (item) => String(item.id) === String(productId),
  );

  const handleAddToCart = () => {
    addToCart(glowstick);
    router.push("/cart");
  };

  if (!glowstick) {
    return <div className={styles.notFound}>Glowstick Not Found!</div>;
  }
  return (
    <div className={styles.detailsContainer}>
      <button className={styles.backBtn} onClick={() => window.history.back()}>
        &larr; Back
      </button>

      <div className={styles.productLayout}>
        {/* Large Placeholder Image */}
        <div className={styles.imagePlaceholder}>
          <Image
            className={styles.productImage}
            src={glowstick.image}
            alt={glowstick.name}
          />
        </div>

        {/* Product Information Column */}
        <div className={styles.productInfo}>
          <h1 className={styles.productName}>{glowstick.name}</h1>

          <div className={styles.ratingContainer}>
            <span className={styles.stars}>
              {"⭐".repeat(glowstick.rating)}
            </span>
          </div>

          <p className={styles.productDescription}>{glowstick.description}</p>

          <div className={styles.priceTag}>${glowstick.price.toFixed(2)}</div>

          <button className={styles.addToCartBtn} onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
