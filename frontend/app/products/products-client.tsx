"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Heart, ShoppingCart, Search } from "lucide-react";
import { motion } from "framer-motion";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import { useAuth } from "@/lib/auth-context";
import { apiAddToCart } from "@/lib/cart-api";
import { apiAddToWishlist } from "@/lib/wishlist-api";
import StoreHeader from "@/app/components/StoreHeader";
import styles from "./products.module.css";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function ProductsClient() {
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get("category")?.trim() ?? "";
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryQuery);
  const [stockOnly, setStockOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!categoryQuery) {
      setSelectedCategory("");
      return;
    }

    if (categories.includes(categoryQuery)) {
      setSelectedCategory(categoryQuery);
    } else {
      setSelectedCategory("");
    }
  }, [categoryQuery, categories]);

  const handleAddToCart = async (itemId: string) => {
    setError(null);
    setActionMessage(null);
    try {
      setActionBusy(`cart:${itemId}`);
      const quantity = quantityMap[itemId] ?? 1;
      await apiAddToCart(itemId, quantity);
      setActionMessage(`Added ${quantity} item(s) to cart`);
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

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const productMatches = items
      .filter((item) => item.name.toLowerCase().includes(term))
      .slice(0, 4)
      .map((item) => ({ type: "product" as const, label: item.name }));

    const categoryMatches = categories
      .filter((category) => category.toLowerCase().includes(term))
      .slice(0, 3)
      .map((category) => ({ type: "category" as const, label: category }));

    let buyAgain: Array<{ type: "buy-again"; label: string }> = [];
    try {
      const buyAgainSource = globalThis.window?.localStorage.getItem("gc_buy_again_items") ?? "[]";
      const parsed = JSON.parse(buyAgainSource);
      if (Array.isArray(parsed)) {
        buyAgain = parsed
          .filter((name): name is string => typeof name === "string")
          .filter((name) => name.toLowerCase().includes(term))
          .slice(0, 2)
          .map((name) => ({ type: "buy-again" as const, label: name }));
      }
    } catch {
      // Silently ignore localStorage parse errors and fall back to empty array
    }

    return [...buyAgain, ...productMatches, ...categoryMatches].slice(0, 8);
  }, [items, categories, query]);

  return (
    <main className={styles.page}>
      <StoreHeader />

      <section className={styles.controls}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product name, SKU, or description"
              className={styles.search}
            />
            {suggestions.length > 0 ? (
              <div className={styles.suggestionBox}>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.label}-${index}`}
                    type="button"
                    className={styles.suggestionItem}
                    onClick={() => {
                      if (suggestion.type === "category") {
                        setSelectedCategory(suggestion.label);
                      }
                      setQuery(suggestion.label);
                    }}
                  >
                    <span className={styles.suggestionType}>{suggestion.type}</span>
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
          ) : (
            filteredProducts.map((item) => (
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
                    <div className={styles.quickAddRow}>
                      <div className={styles.qtyControl}>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => setQuantityMap((prev) => ({ ...prev, [item._id]: Math.max(1, (prev[item._id] ?? 1) - 1) }))}
                        >
                          -
                        </button>
                        <span>{quantityMap[item._id] ?? 1}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => setQuantityMap((prev) => ({ ...prev, [item._id]: (prev[item._id] ?? 1) + 1 }))}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAddToCart(item._id)}
                        disabled={actionBusy === `cart:${item._id}`}
                      >
                        <ShoppingCart size={14} /> {actionBusy === `cart:${item._id}` ? "Adding..." : "Add to Cart"}
                      </button>
                      <motion.button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleAddToWishlist(item._id)}
                        disabled={actionBusy === `wish:${item._id}`}
                        whileTap={{ scale: 0.88 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Heart size={14} /> {actionBusy === `wish:${item._id}` ? "Adding..." : "Wishlist"}
                      </motion.button>
                    </div>
                  ) : null}
                  <Link href={`/products/${item._id}`} className={styles.link}>
                    Product Details
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
}
