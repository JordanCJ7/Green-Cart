"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiGetCart, apiAddToCart, apiUpdateCartItem, apiRemoveFromCart, apiClearCart, Cart, CartItem } from "./cart-api";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (itemId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetCart();
      setCart(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load cart";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (itemId: string, quantity: number) => {
    try {
      setError(null);
      const data = await apiAddToCart(itemId, quantity);
      setCart(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add to cart";
      setError(message);
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    try {
      setError(null);
      const data = await apiUpdateCartItem(itemId, quantity);
      setCart(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update item";
      setError(message);
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setError(null);
      const data = await apiRemoveFromCart(itemId);
      setCart(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove item";
      setError(message);
      throw err;
    }
  }, []);

  const clearCartHandler = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClearCart();
      setCart(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clear cart";
      setError(message);
      throw err;
    }
  }, []);

  const totalItems = cart?.totalItems ?? 0;
  const totalPrice = cart?.totalPrice ?? 0;

  const value: CartContextValue = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateItem,
    removeItem,
    clearCart: clearCartHandler,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
