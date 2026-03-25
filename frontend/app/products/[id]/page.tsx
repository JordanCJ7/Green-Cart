import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import ProductActions from "./ProductActions";
import ProductHeaderActions from "./ProductHeaderActions";
import styles from "./product-detail.module.css";

interface ProductPageProps {
  readonly params: {
    readonly id: string;
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
          <ProductHeaderActions />
        </nav>
      </header>

      <section className={styles.detailCard}>
        <div className={styles.media}>
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              priority
              className={styles.productImage}
            />
          ) : (
            <div className={styles.placeholderImage}>{product.name.slice(0, 1).toUpperCase()}</div>
          )}
        </div>
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

          <ProductActions itemId={product._id} inStock={product.stock > 0} isActive={product.isActive} />
        </div>
      </section>
    </main>
  );
}
