"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, Loader2, MapPin, ReceiptText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGetCart, type Cart } from "@/lib/cart-api";
import { apiInitiatePayment, submitPayHereForm } from "@/lib/payment";
import styles from "./checkout.module.css";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Delivery",
  2: "Review",
  3: "Payment"
};

function getStepTitle(step: Step): string {
  const map: Record<Step, string> = {
    1: "Delivery Info",
    2: "Review Items",
    3: "Payment"
  };

  return map[step];
}

function getReturnUrl(): string {
  return `${globalThis.location?.origin ?? "http://localhost:3000"}/checkout/success`;
}

function getDeliveryPreview(address: string, city: string): string {
  if (address) {
    return `${address}, ${city}`;
  }

  return "Add your delivery address in Step 1.";
}

function renderStepContent(
  step: Step,
  cart: Cart,
  stylesMap: Record<string, string>,
  deliveryInfo: { fullName: string; phone: string; address: string; city: string; notes: string },
  setDeliveryInfo: React.Dispatch<React.SetStateAction<{ fullName: string; phone: string; address: string; city: string; notes: string }>>
): React.ReactNode {
  if (step === 1) {
    return (
      <div className={stylesMap.formGrid}>
        <label className="form-group">
          <span className="form-label">Full Name</span>
          <input
            className="form-input"
            value={deliveryInfo.fullName}
            onChange={(e) => setDeliveryInfo((p) => ({ ...p, fullName: e.target.value }))}
          />
        </label>
        <label className="form-group">
          <span className="form-label">Phone</span>
          <input
            className="form-input"
            value={deliveryInfo.phone}
            onChange={(e) => setDeliveryInfo((p) => ({ ...p, phone: e.target.value }))}
          />
        </label>
        <label className="form-group" style={{ gridColumn: "1 / -1" }}>
          <span className="form-label">Address</span>
          <input
            className="form-input"
            value={deliveryInfo.address}
            onChange={(e) => setDeliveryInfo((p) => ({ ...p, address: e.target.value }))}
          />
        </label>
        <label className="form-group">
          <span className="form-label">City</span>
          <input
            className="form-input"
            value={deliveryInfo.city}
            onChange={(e) => setDeliveryInfo((p) => ({ ...p, city: e.target.value }))}
          />
        </label>
        <label className="form-group">
          <span className="form-label">Delivery Notes</span>
          <input
            className="form-input"
            value={deliveryInfo.notes}
            onChange={(e) => setDeliveryInfo((p) => ({ ...p, notes: e.target.value }))}
          />
        </label>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className={stylesMap.reviewList}>
        {cart.items.map((item) => (
          <article key={item.itemId} className={stylesMap.reviewItem}>
            <div>
              <h3>{item.name}</h3>
              <p>{item.quantity} x Rs. {item.price.toFixed(2)}</p>
            </div>
            <strong>Rs. {(item.quantity * item.price).toFixed(2)}</strong>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={stylesMap.paymentReady}>
      <CheckCircle2 size={20} />
      <p>Ready to complete payment via PayHere secure checkout.</p>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const loadCart = async () => {
      try {
        setLoading(true);
        const data = await apiGetCart();
        setCart(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user, router]);

  const canContinueDelivery = useMemo(() => {
    return Boolean(
      deliveryInfo.fullName.trim() &&
      deliveryInfo.phone.trim() &&
      deliveryInfo.address.trim() &&
      deliveryInfo.city.trim()
    );
  }, [deliveryInfo]);

  const stepTitle = getStepTitle(step);

  const handlePay = async () => {
    if (!user || !cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderId = `ORD-${Date.now()}`;
      const response = await apiInitiatePayment({
        orderId,
        customerId: user._id,
        amount: cart.totalPrice,
        currency: "LKR",
        returnUrl: getReturnUrl(),
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });

      localStorage.setItem("gc_last_txn_id", response.transactionId);
      localStorage.setItem("gc_last_order_id", orderId);
      localStorage.setItem("gc_buy_again_items", JSON.stringify(cart.items.map((item) => item.name)));
      submitPayHereForm(response.checkoutUrl, response.paymentPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment.");
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <section className={`${styles.card} ${styles.checkoutRoot}`}>
        <div className={styles.checkoutHead}>
          <div>
            <h1 className={styles.title}>Checkout Flow</h1>
            <p className={styles.sub}>Step-by-step checkout for faster and safer conversion.</p>
          </div>
          <Link href="/customer/cart" className="btn btn-ghost">
            <ArrowLeft size={15} /> Back to Cart
          </Link>
        </div>

        <div className={styles.stepper}>
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.stepPill} ${step === s ? styles.stepPillActive : ""}`}
              onClick={() => setStep(s as Step)}
            >
              <span className={styles.stepIndex}>{s}</span>
              <span>{STEP_LABELS[s as Step]}</span>
            </button>
          ))}
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        {loading ? (
          <div className={styles.loadingPanel}>
            <Loader2 size={20} className={styles.spin} />
            <span>Loading checkout data...</span>
          </div>
        ) : null}

        {!loading && cart && cart.items.length === 0 ? (
          <div className={styles.loadingPanel}>Your cart is empty. Add products before checkout.</div>
        ) : null}

        {!loading && cart && cart.items.length > 0 ? (
          <div className={styles.checkoutGrid}>
            <section className={styles.mainStepCard}>
              <h2 className={styles.sectionTitle}>{stepTitle}</h2>

              {renderStepContent(step, cart, styles, deliveryInfo, setDeliveryInfo)}

              <div className={styles.stepActions}>
                {step > 1 ? (
                  <button className="btn btn-secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
                    <ArrowLeft size={15} /> Previous
                  </button>
                ) : <span />}

                {step < 3 ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep((s) => (s + 1) as Step)}
                    disabled={step === 1 && !canContinueDelivery}
                  >
                    Next <ArrowRight size={15} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handlePay} disabled={submitting}>
                    {submitting ? <Loader2 size={15} className={styles.spin} /> : <CreditCard size={15} />}
                    {submitting ? "Redirecting..." : "Pay with PayHere"}
                  </button>
                )}
              </div>
            </section>

            <aside className={styles.summaryCardEnhanced}>
              <h3><ReceiptText size={16} /> Order Snapshot</h3>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}><span>Items</span><strong>{cart.totalItems}</strong></div>
                <div className={styles.summaryRow}><span>Subtotal</span><strong>Rs. {cart.totalPrice.toFixed(2)}</strong></div>
                <div className={styles.summaryRow}><span>Shipping</span><strong>FREE</strong></div>
                <div className={styles.summaryRow}><span>Tax</span><strong>Included</strong></div>
              </div>
              <div className={styles.totalRow}><span>Total</span><strong>Rs. {cart.totalPrice.toFixed(2)}</strong></div>
              <div className={styles.deliveryPreview}>
                <p><MapPin size={14} /> Delivery</p>
                <small>{getDeliveryPreview(deliveryInfo.address, deliveryInfo.city)}</small>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
