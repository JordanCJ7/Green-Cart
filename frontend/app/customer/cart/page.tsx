"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { apiInitiatePayment, submitPayHereForm } from "@/lib/payment";
import { AlertTriangle, ArrowLeft, Minus, Plus, Trash2, ShoppingCart, CreditCard, Loader2 } from "lucide-react";

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
      const response = await apiInitiatePayment({
        orderId: `ORD-${Date.now()}`,
        customerId: user._id,
        amount: cart.totalPrice,
        currency: "LKR",
        returnUrl: `${typeof globalThis !== "undefined" && globalThis.location ? globalThis.location.origin : "http://localhost:3000"}/checkout/success`,
        items: cart.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });

      localStorage.setItem("gc_last_txn_id", response.transactionId);
      localStorage.setItem("gc_cart_order_id", `ORD-${Date.now()}`);
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
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
        <p>Loading cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <ShoppingCart size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
        <h2>Your cart is empty</h2>
        <p style={{ color: "var(--ink-subtle)", marginBottom: "1.5rem" }}>
          Start shopping to add items to your cart
        </p>
        <Link href="/customer/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <ShoppingCart size={28} /> Shopping Cart
      </h1>

      {(cartError || checkoutError) && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: "1.5rem" }}>
          <AlertTriangle size={16} /> {cartError || checkoutError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
        <div>
          <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            {cart.items.map(item => (
              <div key={item.itemId} style={{
                display: "flex",
                gap: "1rem",
                padding: "1.5rem",
                borderBottom: "1px solid #e5e7eb",
                alignItems: "flex-start"
              }}>
                {item.image && (
                  <Image src={item.image} alt={item.name} width={100} height={100} style={{
                    objectFit: "cover",
                    borderRadius: "6px",
                    background: "#f9fafb"
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: "0.25rem" }}>{item.name}</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--ink-subtle)", marginBottom: "0.75rem" }}>
                    SKU: {item.sku}
                  </p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#166534", marginBottom: "1rem" }}>
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                      className="btn btn-sm"
                      style={{ padding: "0.4rem 0.6rem" }}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: "40px", textAlign: "center", fontWeight: 600 }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                      className="btn btn-sm"
                      style={{ padding: "0.4rem 0.6rem" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.itemId)}
                  className="btn btn-sm"
                  style={{ color: "#dc2626" }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: "8px", padding: "1.5rem", height: "fit-content", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h3>Order Summary</h3>
          <div style={{ margin: "1.5rem 0", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span>Subtotal</span>
              <span>Rs. {cart.totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span>Shipping</span>
              <span>FREE</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span>Tax</span>
              <span>Included</span>
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.25rem",
            fontWeight: 700,
            paddingTop: "1rem",
            borderTop: "2px solid #e5e7eb",
            marginBottom: "1.5rem"
          }}>
            <span>Total</span>
            <span style={{ color: "#166534" }}>Rs. {cart.totalPrice.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className={`btn btn-primary ${checkingOut ? "btn-loading" : ""}`}
            style={{ width: "100%", marginBottom: "0.75rem" }}
          >
            {checkingOut ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
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
        </div>
      </div>
    </div>
  );
}
