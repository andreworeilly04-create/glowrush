'use client'
import React, { useState, useEffect } from 'react';
import styles from './page.glowsticks.module.css';
import { glowsticks } from '../../data/glowsticks';
import Image from 'next/image'
import Link from 'next/link'

export default function GlowsticksPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state on initial mount or filter change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // 800ms skeleton loading simulation
    return () => clearTimeout(timer);
  }, [selectedCategory, sortOrder]);

  // Filter by category and search query
  const filteredProducts = glowsticks.filter((glowstick) => {
    const matchesCategory = selectedCategory === 'All' || glowstick.category === selectedCategory;
    const matchesSearch = glowstick.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products based on user selection (High to Low, Low to High, and Rating)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'price-low-high') return a.price - b.price;
    if (sortOrder === 'price-high-low') return b.price - a.price;
    if (sortOrder === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <div className={styles.glowsticksContainer}>
      <header className={styles.glowsticksHeader}>
        <h1 className={styles.glowsticksTitle}>GLOWSTICKS</h1>

        <div className={styles.searchContainer}>
          {!isSearchOpen ? (
            <button
              onClick={() => setIsSearchOpen(true)}
              className={styles.searchToggleBtn}
              aria-label="Open search"
            >
              <svg
                className={styles.searchIcon}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          ) : (
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="search for glowsticks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className={styles.glowSearchInput}
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Filter and Sorting Controls */}
      <div className={styles.filterSortBar}>
        <div className={styles.categorySelector}>
          <label htmlFor="category-select" className={styles.filterLabel}>Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Categories</option>
            <option value="Glow Sticks">Glow Sticks</option>
            <option value="Wearable Glow Accessories">Wearable Glow Accessories</option>
            <option value="Bulk Party Supplies">Bulk Party Supplies</option>
            <option value="Special Effects & Gear">Special Effects & Gear</option>
          </select>
        </div>

        <div className={styles.sortSelector}>
          <label htmlFor="sort-select" className={styles.filterLabel}>Sort By:</label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="default">Featured</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <main>
        <div className={styles.glowsticksGrid}>
          {isLoading ? (
            // Render Skeleton Loaders
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={`${styles.productCard} ${styles.skeletonCard}`}>
                <div className={`${styles.productImageContainer} ${styles.skeletonPulse}`}></div>
                <div className={styles.productInfo}>
                  <div>
                    <div className={`${styles.skeletonLine} ${styles.skeletonTitle} ${styles.skeletonPulse}`}></div>
                    <div className={`${styles.skeletonLine} ${styles.skeletonPrice} ${styles.skeletonPulse}`}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Render Actual Products
            sortedProducts.map((glowstick) => (
              <Link href={`/glowstick/${glowstick.id}`} key={glowstick.id} className={styles.productCard}>
                <div className={styles.productImageContainer}>
                  {glowstick.image ? (
                    <Image src={glowstick.image} alt={glowstick.name} className={styles.productImage} />
                  ) : (
                    <div className={styles.productImagePlaceholder}>Latest Product #{glowstick.id}</div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <div>
                    <h2 className={styles.productName}>{glowstick.name}</h2>
                    <p className={styles.productPrice}>
                      {typeof glowstick.price === 'number' ? `$${glowstick.price.toFixed(2)}` : glowstick.price}
                    </p>
                    {glowstick.rating && (
                      <p className={styles.productRating}>
                        ★ {glowstick.rating}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}