"use client";

import { use, useEffect, useState } from "react";
import { useCart } from "@/context/context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.glowstick.module.css";
import productsData from "@/data/glowsticks";
import Image from "next/image";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetailsPage({
  params,
}: PageProps) {
  const { cart, addToCart } = useCart();
  const router = useRouter();

  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          console.log(
            "Product page: Firebase user signed in:",
            user.uid
          );

          setIsLoggedIn(true);
        } else {
          console.log(
            "Product page: No Firebase user signed in."
          );

          setIsLoggedIn(false);
        }

        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const glowstick = productsData.find(
    (item) =>
      String(item.id) === String(productId)
  );

  const isInCart = cart.some(
    (item: any) =>
      String(item.id) === String(productId)
  );

  if (!glowstick) {
    return (
      <div className={styles.notFound}>
        Glowstick Not Found!
      </div>
    );
  }

  const handleAddToCart = () => {
    const localCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    if (
      !localCart.some(
        (item: any) =>
          String(item.id) ===
          String(glowstick.id)
      )
    ) {
      localCart.push(glowstick);

      localStorage.setItem(
        "cart",
        JSON.stringify(localCart)
      );
    }

    addToCart(glowstick);
  };

  const handleButtonClick = () => {
    // Wait for Firebase Auth to finish checking the session.
    if (authLoading) {
      return;
    }

    // User is not signed into Firebase.
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // User is already signed in and product is in cart.
    if (isInCart) {
      router.push("/cart");
      return;
    }

    // User is signed in and product is not in cart.
    handleAddToCart();
  };

  const relatedProducts = productsData
    .filter(
      (item) =>
        item.category === glowstick.category &&
        item.id !== glowstick.id
    )
    .sort((a, b) =>
      a.id > b.id ? 1 : -1
    )
    .slice(0, 8);

  return (
    <div className={styles.detailsContainer}>
      <button
        className={styles.backBtn}
        onClick={() => window.history.back()}
      >
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

        <div className={styles.productInfo}>
          <h1 className={styles.productName}>
            {glowstick.name}
          </h1>

          <div
            className={
              styles.ratingContainer
            }
          >
            <span className={styles.stars}>
              {"⭐".repeat(
                glowstick.rating
              )}
            </span>
          </div>

          <p
            className={
              styles.productDescription
            }
          >
            {glowstick.description}
          </p>

          <div className={styles.priceTag}>
            ${glowstick.price.toFixed(2)}
          </div>

          <button
            className={
              styles.addToCartBtn
            }
            onClick={handleButtonClick}
            disabled={authLoading}
          >
            {authLoading
              ? "Checking Login..."
              : !isLoggedIn
              ? "Login to Add"
              : isInCart
              ? "View Cart"
              : "Add To Cart"}
          </button>
        </div>
      </div>

      <div className={styles.relatedSection}>
        <h2>Related Products</h2>

        <div className={styles.relatedGrid}>
          {relatedProducts.map(
            (relatedItem) => (
              <Link
                key={relatedItem.id}
                href={`/glowstick/${relatedItem.id}`}
                className={
                  styles.relatedCard
                }
              >
                <div
                  className={
                    styles.relatedImageWrapper
                  }
                >
                  <Image
                    src={relatedItem.image}
                    alt={relatedItem.name}
                    width={80}
                    height={80}
                    className={
                      styles.relatedImage
                    }
                  />
                </div>

                <div
                  className={
                    styles.relatedDetails
                  }
                >
                  <h3>
                    {relatedItem.name}
                  </h3>

                  <div
                    className={
                      styles.relatedRating
                    }
                  >
                    <span
                      className={
                        styles.relatedStars
                      }
                    >
                      {"⭐".repeat(
                        relatedItem.rating
                      )}
                    </span>
                  </div>

                  <span
                    className={
                      styles.relatedPrice
                    }
                  >
                    $
                    {relatedItem.price.toFixed(
                      2
                    )}
                  </span>
                </div>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

