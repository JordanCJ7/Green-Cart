import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import styles from "./product-detail.module.css";

interface ProductPageProps {
  params: {
    id: string;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

async function getProduct(id: string): Promise<InventoryItem | null> {
  try {
    const response = await inventoryApi.getItemById(id);
    return response.item;
  } catch {
    return null;
  }
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>GreenCart Market</Link>
        <nav className={styles.nav}>
          <Link href="/products">Back to Products</Link>
          <Link href="/login">Sign In</Link>
        </nav>
      </header>

      <section className={styles.detailCard}>
        <div className={styles.media}>{product.name.slice(0, 1).toUpperCase()}</div>
        <div className={styles.content}>
          <p className={styles.sku}>SKU: {product.sku}</p>
          <h1>{product.name}</h1>
          <p className={styles.description}>{product.description || "No product description provided."}</p>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            {product.compareAtPrice ? (
              <span className={styles.compareAt}>{formatCurrency(product.compareAtPrice)}</span>
            ) : null}
          </div>

          <div className={styles.metaRow}>
            <span className={product.stock > 0 ? styles.stockGood : styles.stockLow}>
              {product.stock > 0 ? `${product.stock} ${product.unit} available` : "Out of stock"}
            </span>
            <span className={product.isActive ? styles.statusActive : styles.statusInactive}>
              {product.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className={styles.actions}>
            <Link href="/products" className="btn btn-secondary">Continue Browsing</Link>
            <Link href="/login" className="btn btn-primary">Sign in to Purchase</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
