"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { apiGetWishlist, apiAddToWishlist, apiRemoveFromWishlist, apiCheckWishlisted, apiClearWishlist, Wishlist } from "./wishlist-api";

interface WishlistContextValue {
  wishlist: Wishlist | null;
  loading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (itemId: string) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  checkWishlisted: (itemIds: string[]) => Promise<Record<string, boolean>>;
  clearWishlist: () => Promise<void>;
  isWishlisted: (itemId: string) => boolean;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetWishlist();
      setWishlist(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load wishlist";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(async (itemId: string) => {
    try {
      setError(null);
      const data = await apiAddToWishlist(itemId);
      setWishlist(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add to wishlist";
      setError(message);
      throw err;
    }
  }, []);

  const removeFromWishlist = useCallback(async (itemId: string) => {
    try {
      setError(null);
      const data = await apiRemoveFromWishlist(itemId);
      setWishlist(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove from wishlist";
      setError(message);
      throw err;
    }
  }, []);

  const checkWishlistedHandler = useCallback(async (itemIds: string[]): Promise<Record<string, boolean>> => {
    try {
      setError(null);
      return await apiCheckWishlisted(itemIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check wishlist status";
      setError(message);
      throw err;
    }
  }, []);

  const clearWishlistHandler = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClearWishlist();
      setWishlist(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clear wishlist";
      setError(message);
      throw err;
    }
  }, []);

  const isWishlisted = useCallback((itemId: string) => {
    return wishlist?.items.some(item => item.itemId === itemId) ?? false;
  }, [wishlist]);

  const itemCount = wishlist?.items.length ?? 0;

  const value: WishlistContextValue = {
    wishlist,
    loading,
    error,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlisted: checkWishlistedHandler,
    clearWishlist: clearWishlistHandler,
    isWishlisted,
    itemCount,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
