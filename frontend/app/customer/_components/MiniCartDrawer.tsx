"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import styles from "../customer.module.css";

export function MiniCartDrawer() {
  const { cart, totalItems, totalPrice, fetchCart } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCart().catch(() => {
      // Keep drawer UI available even if cart fetch fails.
    });
  }, [fetchCart]);

  const hasItems = useMemo(() => (cart?.items?.length ?? 0) > 0, [cart?.items?.length]);

  return (
    <>
      <button
        type="button"
        className={styles.floatingCartBtn}
        onClick={() => setOpen(true)}
        aria-label="Open mini cart"
      >
        <ShoppingCart size={18} />
        <span>Cart</span>
        <motion.span
          key={totalItems}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={styles.floatingCartBadge}
        >
          {totalItems}
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className={styles.drawerOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className={styles.miniCartDrawer}
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <div className={styles.miniCartHead}>
                <h3>Mini Cart</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                  <X size={15} />
                </button>
              </div>

              {hasItems ? (
                <div className={styles.miniCartList}>
                  {cart?.items.slice(0, 6).map((item) => (
                    <article key={item.itemId} className={styles.miniCartItem}>
                      <div>
                        <p>{item.name}</p>
                        <small>{item.quantity} x Rs. {item.price.toFixed(2)}</small>
                      </div>
                      <strong>Rs. {(item.quantity * item.price).toFixed(2)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.miniCartEmpty}>Your cart is currently empty.</p>
              )}

              <div className={styles.miniCartFooter}>
                <div className={styles.miniCartTotals}>
                  <span>Total</span>
                  <strong>Rs. {totalPrice.toFixed(2)}</strong>
                </div>
                <Link href="/customer/cart" className="btn btn-secondary btn-full" onClick={() => setOpen(false)}>
                  View Full Cart
                </Link>
                <Link href="/checkout" className="btn btn-primary btn-full" onClick={() => setOpen(false)}>
                  Checkout
                </Link>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
