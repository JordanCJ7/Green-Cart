import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import ProductActions from "./ProductActions";
import StoreHeader from "@/app/components/StoreHeader";
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

async function getFrequentlyBoughtTogether(product: InventoryItem): Promise<InventoryItem[]> {
  try {
    const response = await inventoryApi.getItems({
      limit: "4",
      category: product.category,
      isActive: "true",
      inStock: "true",
      sort: "-updatedAt"
    });
    return response.items.filter((item) => item._id !== product._id).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const frequentlyBought = await getFrequentlyBoughtTogether(product);

  return (
    <main className={styles.page}>
      <StoreHeader showBackToProducts={true} />

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

      <section className={styles.relatedSection}>
        <h2>Frequently Bought Together</h2>
        {frequentlyBought.length === 0 ? (
          <p className={styles.description}>No related combinations available right now.</p>
        ) : (
          <div className={styles.relatedGrid}>
            {frequentlyBought.map((item) => (
              <article key={item._id} className={styles.relatedCard}>
                <h3>{item.name}</h3>
                <p>{item.category}</p>
                <span className={styles.price}>{formatCurrency(item.price)}</span>
                <Link href={`/products/${item._id}`} className="btn btn-secondary btn-sm">View</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
