"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { apiInitiatePayment, submitPayHereForm } from "@/lib/payment";
import { AlertTriangle, ArrowLeft, Minus, Plus, Trash2, ShoppingCart, CreditCard, Loader2 } from "lucide-react";
import styles from "./cart.module.css";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, loading, error: cartError, fetchCart, updateItem, removeItem } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [user, fetchCart, router]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      await updateItem(itemId, newQuantity);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      setCheckoutError("Cart is empty");
      return;
    }

    if (!user) {
      setCheckoutError("Please login to checkout");
      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const orderId = `ORD-${Date.now()}`;
      const response = await apiInitiatePayment({
        orderId,
        customerId: user._id,
        amount: cart.totalPrice,
        currency: "LKR",
        returnUrl: `${globalThis.location?.origin ?? "http://localhost:3000"}/checkout/success`,
        items: cart.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });

      localStorage.setItem("gc_last_txn_id", response.transactionId);
      localStorage.setItem("gc_cart_order_id", orderId);
      localStorage.setItem("gc_buy_again_items", JSON.stringify(cart.items.map((item) => item.name)));
      submitPayHereForm(response.checkoutUrl, response.paymentPayload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate payment";
      setCheckoutError(message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.centerState}>
        <Loader2 size={32} className={styles.spin} />
        <p>Loading cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <ShoppingCart size={48} className={styles.emptyIcon} />
        <h2>Your cart is empty</h2>
        <p className={styles.emptyCopy}>
          Start shopping to add items to your cart
        </p>
        <Link href="/customer/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>
        <ShoppingCart size={28} /> Shopping Cart
      </h1>

      {(cartError || checkoutError) && (
        <div className={`alert alert-error ${styles.alert}`} role="alert">
          <AlertTriangle size={16} /> {cartError || checkoutError}
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.itemsWrap}>
          <div className={styles.itemsCard}>
            {cart.items.map(item => (
              <div key={item.itemId} className={styles.itemRow}>
                {item.image && (
                  <Image src={item.image} alt={item.name} width={100} height={100} className={styles.itemImage} />
                )}
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemSku}>
                    SKU: {item.sku}
                  </p>
                  <p className={styles.itemPrice}>
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>

                  <div className={styles.quantityRow}>
                    <button
                      onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                      className={`btn btn-sm ${styles.qtyBtn}`}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.quantityValue}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                      className={`btn btn-sm ${styles.qtyBtn}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.itemId)}
                  className={`btn btn-sm ${styles.removeBtn}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.summaryCard}>
          <h3>Order Summary</h3>
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>Rs. {cart.totalPrice.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>FREE</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>Included</span>
            </div>
          </div>

          <div className={styles.totalRow}>
            <span>Total</span>
            <span className={styles.totalValue}>Rs. {cart.totalPrice.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className={`btn btn-primary ${checkingOut ? "btn-loading" : ""}`}
            style={{ width: "100%", marginBottom: "0.75rem" }}
          >
            {checkingOut ? (
              <>
                <Loader2 size={16} className={styles.spin} />
                Processing...
              </>
            ) : (
              <>
                <CreditCard size={16} />
                Checkout with PayHere
              </>
            )}
          </button>

          <Link href="/customer/dashboard" className="btn btn-ghost" style={{ width: "100%" }}>
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
