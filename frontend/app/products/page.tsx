"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import styles from "./products.module.css";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export default function ProductsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stockOnly, setStockOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await inventoryApi.getItems({
          limit: "100",
          isActive: "true",
          sort: "name"
        });
        setItems(response.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (stockOnly && item.stock <= 0) return false;
      if (!normalizedQuery) return true;

      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.sku.toLowerCase().includes(normalizedQuery) ||
        (item.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [items, query, stockOnly]);

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

      {loading ? (
        <p className={styles.loading}>Loading products...</p>
      ) : (
        <section className={styles.grid}>
          {filteredProducts.length === 0 ? (
            <div className={styles.empty}>No products matched your filter.</div>
          ) : filteredProducts.map((item) => (
            <article key={item._id} className={styles.card}>
              <div className={styles.media}>{item.name.slice(0, 1).toUpperCase()}</div>
              <div className={styles.content}>
                <h2>{item.name}</h2>
                <p>{item.description || "Fresh supermarket item"}</p>
                <div className={styles.metaRow}>
                  <span className={styles.price}>{formatCurrency(item.price)}</span>
                  <span className={item.stock > 0 ? styles.stockGood : styles.stockLow}>
                    {item.stock > 0 ? `${item.stock} ${item.unit}` : "Out"}
                  </span>
                </div>
                <Link href={`/products/${item._id}`} className={styles.link}>Product Details</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
