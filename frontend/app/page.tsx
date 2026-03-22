import React from "react";
import Link from "next/link";
import Image from "next/image";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import styles from "./storefront.module.css";

async function getFeaturedProducts(): Promise<InventoryItem[]> {
  try {
    const response = await inventoryApi.getItems({
      limit: "8",
      sort: "-createdAt",
      isActive: "true"
    });
    return response.items;
  } catch {
    return [];
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>GreenCart Market</div>
        <nav className={styles.nav}>
          <Link href="/products">Products</Link>
          <Link href="/login">Sign In</Link>
          <Link href="/register" className={styles.navCta}>Create Account</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Weekly Grocery Essentials</p>
          <h1>Fresh supermarket shopping with a calm, modern experience.</h1>
          <p>
            Browse produce, pantry goods, and household basics with clear pricing,
            clean product details, and a checkout-ready catalog.
          </p>
          <div className={styles.heroActions}>
            <Link href="/products" className="btn btn-primary btn-lg">Browse Products</Link>
            <Link href="/login" className="btn btn-secondary btn-lg">Customer Login</Link>
          </div>
        </div>
        <div className={styles.heroPanel}>
          <div className={styles.heroPanelTitle}>Store Highlights</div>
          <ul>
            <li>Daily fresh inventory updates</li>
            <li>Clear stock and pricing visibility</li>
            <li>Simple product browsing and details</li>
          </ul>
        </div>
      </section>

      <section className={styles.productsSection}>
        <div className={styles.sectionHeader}>
          <h2>Featured Products</h2>
          <Link href="/products">View full catalog</Link>
        </div>

        <div className={styles.grid}>
          {featuredProducts.length === 0 ? (
            <div className={styles.emptyState}>
              No products are available right now. Please check again shortly.
            </div>
          ) : featuredProducts.map((item) => (
            <article key={item._id} className={styles.card}>
              <div className={styles.cardMedia}>
                {item.images && item.images.length > 0 ? (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    className={styles.cardImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>{item.name.slice(0, 1).toUpperCase()}</div>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3>{item.name}</h3>
                <p className={styles.description}>{item.description || "Fresh supermarket item"}</p>
                <div className={styles.metaRow}>
                  <span className={styles.price}>{formatCurrency(item.price)}</span>
                  <span className={item.stock > 0 ? styles.stockGood : styles.stockLow}>
                    {item.stock > 0 ? `${item.stock} ${item.unit} in stock` : "Out of stock"}
                  </span>
                </div>
                <Link href={`/products/${item._id}`} className={styles.cardLink}>View Details</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 GreenCart Market</p>
        <div>
          <Link href="/products">Catalog</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
      </footer>
    </main>
  );
}
