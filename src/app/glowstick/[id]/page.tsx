"use client";
import { use } from "react";
import { useCart } from "@/context/context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.glowstick.module.css";
import productsData from "@/data/glowsticks";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetailsPage({ params }: PageProps) {
  const { cart, addToCart } = useCart();
  const router = useRouter();

  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const glowstick = productsData.find(
    (item) => String(item.id) === String(productId),
  );

  // Derive cart status directly from the global cart context. 
  // This updates instantly whenever you switch routes or add items, preventing any "stuck" states.
  const isInCart = cart.some((item: any) => String(item.id) === String(productId));

  if (!glowstick) {
    return <div className={styles.notFound}>Glowstick Not Found!</div>;
  }

  const handleAddToCart = () => {
    // Also safely sync with local storage for your persistence logic
    const localCart = JSON.parse(localStorage.getItem("cart") || '[]');
    if (!localCart.some((item: any) => String(item.id) === String(glowstick.id))) {
      localCart.push(glowstick);
      localStorage.setItem("cart", JSON.stringify(localCart));
    }
    addToCart(glowstick);
  };

  const handleButtonClick = () => {
    if (isInCart) {
      router.push("/cart");
    } else {
      handleAddToCart();
    }
  };

  // Filter related products (excluding current product, taking up to 4)
  const relatedProducts = productsData
    .filter((item) => String(item.id) !== String(productId))
    .slice(0, 4);

  return (
    <div className={styles.detailsContainer}>
      <button className={styles.backBtn} onClick={() => window.history.back()}>
        &larr; Back
      </button>

      <div className={styles.productLayout}>
        <div className={styles.imagePlaceholder}>
          <Image
            className={styles.productImage}
            src={glowstick.image}
            alt={glowstick.name}
            width={300}
            height={300}
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

          <button className={styles.addToCartBtn} onClick={handleButtonClick}>
            {isInCart ? "View Cart" : "Add To Cart"}
          </button>
        </div>
      </div>

      {/* Related Products Section */}
      <div className={styles.relatedSection}>
        <h2>Related Products</h2>
        <div className={styles.relatedGrid}>
          {relatedProducts.map((relatedItem) => (
            <Link 
              key={relatedItem.id} 
              href={`/glowstick/${relatedItem.id}`}
              className={styles.relatedCard}
            >
              <div className={styles.relatedImageWrapper}>
                <Image
                  src={relatedItem.image}
                  alt={relatedItem.name}
                  width={80}
                  height={80}
                  className={styles.relatedImage}
                />
              </div>
              <div className={styles.relatedDetails}>
                <h3>{relatedItem.name}</h3>
                <span className={styles.relatedPrice}>${relatedItem.price.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}