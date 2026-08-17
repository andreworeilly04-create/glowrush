'use client'
import React, { useState } from 'react';
import './page.glowsticks.css';
import { glowsticks } from '../../data/glowsticks';
import Image from 'next/image'

export default function GlowsticksPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');

  // Filter by category and search query
  const filteredProducts = glowsticks.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="glowsticks-container">
      <header className="glowsticks-header">
        <h1 className="glowsticks-title">GLOWSTICKS</h1>

        <div className="search-container">
          {!isSearchOpen ? (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="search-toggle-btn"
              aria-label="Open search"
            >
              <svg
                className="search-icon"
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
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="search for glowsticks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="glow-search-input"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Filter and Sorting Controls */}
      <div className="filter-sort-bar">
        <div className="category-selector">
          <label htmlFor="category-select" className="filter-label">Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Categories</option>
            <option value="Classic">Classic</option>
            <option value="Colorful">Colorful</option>
            <option value="Ultra Bright">Ultra Bright</option>
            <option value="Wearable">Wearable</option>
            <option value="Mini">Mini</option>
          </select>
        </div>

        <div className="sort-selector">
          <label htmlFor="sort-select" className="filter-label">Sort By:</label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="filter-select"
          >
            <option value="default">Featured</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <main>
        <div className="glowsticks-grid">
          {sortedProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                {product.image ? (
                  <Image src={product.image} alt={product.name} className="product-image" />
                ) : (
                  <div className="product-image-placeholder">Latest Product #{product.id}</div>
                )}
              </div>
              <div className="product-info">
                <div>
                  <h2 className="product-name">{product.name}</h2>
                  <p className="product-price">
                    {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : product.price}
                  </p>
                  {product.rating && (
                    <p className="product-rating">
                      ★ {product.rating}
                    </p>
                  )}
                </div>
                <button className="add-to-cart-btn">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}