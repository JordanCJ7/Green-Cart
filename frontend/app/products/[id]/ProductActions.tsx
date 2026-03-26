"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiAddToCart } from "@/lib/cart-api";
import { apiAddToWishlist } from "@/lib/wishlist-api";
import { Heart, ShoppingCart } from "lucide-react";
import styles from "./product-detail.module.css";

interface ProductActionsProps {
  readonly itemId: string;
  readonly inStock: boolean;
  readonly isActive: boolean;
}

export default function ProductActions({ itemId, inStock, isActive }: ProductActionsProps) {
  const { user, loading } = useAuth();
  const [addingCart, setAddingCart] = useState(false);
  const [addingWishlist, setAddingWishlist] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPurchase = inStock && isActive;

  const handleAddToCart = async () => {
    if (!canPurchase) return;
    setError(null);
    setMessage(null);
    try {
      setAddingCart(true);
      await apiAddToCart(itemId, 1);
      setMessage("Item added to cart");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to add to cart";
      setError(text);
    } finally {
      setAddingCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    setError(null);
    setMessage(null);
    try {
      setAddingWishlist(true);
      await apiAddToWishlist(itemId);
      setMessage("Item added to wishlist");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to add to wishlist";
      setError(text);
    } finally {
      setAddingWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.actions}>
        <Link href="/products" className="btn btn-secondary">Continue Browsing</Link>
        <button type="button" className="btn btn-primary" disabled>Checking account...</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.actions}>
        <Link href="/products" className="btn btn-secondary">Continue Browsing</Link>
        <Link href="/login" className="btn btn-primary">Sign in to Purchase</Link>
      </div>
    );
  }

  if (user.role === "customer") {
    return (
      <>
        <div className={styles.actions}>
          <Link href="/products" className="btn btn-secondary">Continue Browsing</Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={!canPurchase || addingCart}
          >
            <ShoppingCart size={16} /> {addingCart ? "Adding..." : "Add to Cart"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleAddToWishlist}
            disabled={addingWishlist}
          >
            <Heart size={16} /> {addingWishlist ? "Adding..." : "Add to Wishlist"}
          </button>
          <Link href="/customer/cart" className="btn btn-ghost">Go to Cart</Link>
        </div>
        {!canPurchase && (
          <p className={styles.description}>
            This item is currently unavailable for purchase.
          </p>
        )}
        {message && <p className={styles.statusActive}>{message}</p>}
        {error && <p className={styles.statusInactive}>{error}</p>}
      </>
    );
  }

  return (
    <div className={styles.actions}>
      <Link href="/products" className="btn btn-secondary">Continue Browsing</Link>
      <Link href="/admin/dashboard" className="btn btn-primary">Admin Account - Manage Inventory</Link>
    </div>
  );
}