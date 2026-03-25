"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import { useAuth } from "@/lib/auth-context";
import { apiAddToCart } from "@/lib/cart-api";
import { apiAddToWishlist } from "@/lib/wishlist-api";
import styles from "./products.module.css";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockOnly, setStockOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleAddToCart = async (itemId: string) => {
    setError(null);
    setActionMessage(null);
    try {
      setActionBusy(`cart:${itemId}`);
      await apiAddToCart(itemId, 1);
      setActionMessage("Item added to cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item to cart");
    } finally {
      setActionBusy(null);
    }
  };

  const handleAddToWishlist = async (itemId: string) => {
    setError(null);
    setActionMessage(null);
    try {
      setActionBusy(`wish:${itemId}`);
      await apiAddToWishlist(itemId);
      setActionMessage("Item added to wishlist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item to wishlist");
    } finally {
      setActionBusy(null);
    }
  };

  useEffect(() => {
    async function loadProductsAndCategories() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          inventoryApi.getItems({
            limit: "100",
            isActive: "true",
            sort: "name"
          }),
          inventoryApi.getCategories()
        ]);
        setItems(productsResponse.items);
        setCategories(categoriesResponse.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products.");
      } finally {
        setLoading(false);
      }
    }

    loadProductsAndCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (stockOnly && item.stock <= 0) return false;
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (!normalizedQuery) return true;

      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.sku.toLowerCase().includes(normalizedQuery) ||
        (item.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [items, query, selectedCategory, stockOnly]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>GreenCart Market</Link>
        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/login">Sign In</Link>
        </nav>
      </header>

      <section className={styles.controls}>
        <div>
          <h1>Browse Products</h1>
          <p>Find fresh supermarket essentials and inspect each item in detail.</p>
        </div>
        <div className={styles.filterRow}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product name, SKU, or description"
            className={styles.search}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.search}
            title="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <label className={styles.toggle} htmlFor="stock-only">
            <input
              id="stock-only"
              type="checkbox"
              checked={stockOnly}
              onChange={(e) => setStockOnly(e.target.checked)}
            />
            <span>In stock only</span>
          </label>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}
      {actionMessage && <p className={styles.loading}>{actionMessage}</p>}

      {loading ? (
        <p className={styles.loading}>Loading products...</p>
      ) : (
        <section className={styles.grid}>
          {filteredProducts.length === 0 ? (
            <div className={styles.empty}>No products matched your filter.</div>
          ) : filteredProducts.map((item) => (
            <article key={item._id} className={styles.card}>
              <div className={styles.media}>
                {item.images && item.images.length > 0 ? (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>{item.name.slice(0, 1).toUpperCase()}</div>
                )}
              </div>
              <div className={styles.content}>
                <h2>{item.name}</h2>
                <p>{item.description || "Fresh supermarket item"}</p>
                <div className={styles.metaRow}>
                  <span className={styles.price}>{formatCurrency(item.price)}</span>
                  <span className={item.stock > 0 ? styles.stockGood : styles.stockLow}>
                    {item.stock > 0 ? `${item.stock} ${item.unit}` : "Out"}
                  </span>
                </div>
                {user?.role === "customer" && item.stock > 0 && item.isActive ? (
                  <div className={styles.metaRow}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAddToCart(item._id)}
                      disabled={actionBusy === `cart:${item._id}`}
                    >
                      <ShoppingCart size={14} /> {actionBusy === `cart:${item._id}` ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleAddToWishlist(item._id)}
                      disabled={actionBusy === `wish:${item._id}`}
                    >
                      <Heart size={14} /> {actionBusy === `wish:${item._id}` ? "Adding..." : "Wishlist"}
                    </button>
                  </div>
                ) : null}
                <Link href={`/products/${item._id}`} className={styles.link}>Product Details</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
