"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { Heart, ArrowLeft, Loader2, ShoppingBag, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { wishlist, loading, fetchWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    fetchWishlist();
  }, [user, fetchWishlist, router]);

  const handleAddToCart = async (itemId: string, itemName: string) => {
    try {
      await addToCart(itemId, 1);
      alert(`${itemName} added to cart!`);
    } catch {
      alert("Failed to add to cart");
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      await removeFromWishlist(itemId);
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
        <p>Loading wishlist...</p>
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Heart size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
        <h2>Your wishlist is empty</h2>
        <p style={{ color: "var(--ink-subtle)", marginBottom: "1.5rem" }}>
          Add items to your wishlist to save them for later
        </p>
        <Link href="/customer/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} /> Start Exploring
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Heart size={28} /> My Wishlist
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem"
      }}>
        {wishlist.items.map(item => (
          <div
            key={item.itemId}
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {item.image && (
              <Image
                src={item.image}
                alt={item.name}
                width={400}
                height={200}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  background: "#f9fafb"
                }}
              />
            )}

            <h3 style={{ marginBottom: "0.5rem", flex: 1 }}>{item.name}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-subtle)", marginBottom: "0.75rem" }}>
              SKU: {item.sku}
            </p>

            <p style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#166534",
              marginBottom: "1rem"
            }}>
              Rs. {item.price.toFixed(2)}
            </p>

            <p style={{ fontSize: "0.85rem", color: "var(--ink-subtle)", marginBottom: "1rem" }}>
              Added {new Date(item.addedAt).toLocaleDateString()}
            </p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => handleAddToCart(item.itemId, item.name)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <ShoppingBag size={16} /> Add to Cart
              </button>
              <button
                onClick={() => handleRemoveFromWishlist(item.itemId)}
                className="btn btn-ghost"
                style={{ color: "#dc2626" }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
