"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  apiGetPaymentStatus,
  apiInitiatePayment,
  type InitiatePaymentResponse,
  type PaymentStatusResponse,
  submitPayHereForm,
} from "@/lib/payment";
import styles from "./payments.module.css";

function buildOrderId(): string {
  return `GC-${Date.now()}`;
}

export default function CustomerPaymentsPage() {
  const { user } = useAuth();

  const [amountLkr, setAmountLkr] = useState("1500");
  const [orderId, setOrderId] = useState(buildOrderId());
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInit, setPaymentInit] = useState<InitiatePaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);

  const amountInLkr = useMemo(() => {
    const parsed = Number(amountLkr);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Number(parsed.toFixed(2));
  }, [amountLkr]);

  const platformFeeLkr = 0;
  const totalLkr = useMemo(() => Number((amountInLkr + platformFeeLkr).toFixed(2)), [amountInLkr]);

  async function handleStartPayment(): Promise<void> {
    if (!user) return;

    setError(null);
    if (amountInLkr <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiInitiatePayment({
        orderId,
        customerId: user._id,
        amount: amountInLkr,
        currency: "LKR",
        returnUrl: `${typeof globalThis !== "undefined" && globalThis.location ? globalThis.location.origin : "http://localhost:3000"}/checkout/success`,
        items: [
          {
            name: "Green-Cart checkout items",
            quantity: 1,
            price: amountInLkr,
          },
        ],
      });

      setPaymentInit(response);
      localStorage.setItem("gc_last_txn_id", response.transactionId);
      localStorage.setItem("gc_last_order_id", orderId);

      // Send customer to PayHere checkout immediately.
      submitPayHereForm(response.checkoutUrl, response.paymentPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStatus(): Promise<void> {
    const txnId = paymentInit?.transactionId ?? localStorage.getItem("gc_last_txn_id");
    if (!txnId) {
      setError("No transaction found. Start a payment first.");
      return;
    }

    setError(null);
    setStatusLoading(true);
    try {
      const status = await apiGetPaymentStatus(txnId);
      setPaymentStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payment status");
    } finally {
      setStatusLoading(false);
    }
  }

  function resetDraft(): void {
    setOrderId(buildOrderId());
    setPaymentInit(null);
    setPaymentStatus(null);
    setError(null);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>💳 Payment Checkout</h1>
          <p className={styles.subtitle}>
            Complete your purchase securely via PayHere
          </p>
        </div>
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}

      <section className={styles.checkoutLayout}>
        <article className={styles.card}>
          <h2>📦 Order Details</h2>

          <div className={styles.orderDetails}>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Order ID</span>
              <span>{orderId}</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Customer</span>
              <span>{user?.email ?? "customer@greencart.local"}</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Items</span>
              <span>Green-Cart checkout items</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Subtotal</span>
              <span>Rs. {amountInLkr.toFixed(2)}</span>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Platform Fee</span>
              <span>Rs. {platformFeeLkr.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong>Rs. {totalLkr.toFixed(2)}</strong>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <h2>💰 Payment Checkout</h2>

          <div className={styles.grid}>
            <div className="form-group">
              <label className="form-label" htmlFor="order-id">
                Order ID
              </label>
              <input
                id="order-id"
                className="form-input"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="GC-1234567890"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount-lkr">
                Amount (LKR)
              </label>
              <input
                id="amount-lkr"
                className="form-input"
                type="number"
                min="1"
                step="0.01"
                value={amountLkr}
                onChange={(e) => setAmountLkr(e.target.value)}
                placeholder="1500.00"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
              onClick={handleStartPayment}
              disabled={loading}
              title="Proceed to PayHere checkout"
            >
              {loading ? <span className="btn-spinner" /> : null}
              {loading ? "Processing..." : "💳 Pay with PayHere"}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleCheckStatus}
              disabled={statusLoading}
              title="Check transaction status"
            >
              {statusLoading ? "Checking..." : "🔍 Check Status"}
            </button>

            <button className="btn btn-ghost" onClick={resetDraft} title="Start new payment">
              ↻ New Draft
            </button>
          </div>
        </article>
      </section>

      {paymentInit && (
        <section className={styles.card}>
          <h2>✅ Transaction Created</h2>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Transaction ID</span>
            <code style={{ background: 'rgba(34,197,94,0.05)', padding: '0.35rem 0.65rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 500 }}>
              {paymentInit.transactionId}
            </code>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Current Status</span>
            <span className="badge badge-blue">{paymentInit.status}</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Checkout URL</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--ink-subtle)', wordBreak: 'break-all' }}>
              {paymentInit.checkoutUrl}
            </span>
          </div>
        </section>
      )}

      {paymentStatus && (
        <section className={styles.card}>
          <h2>📊 Payment Status</h2>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Transaction</span>
            <code style={{ background: 'rgba(34,197,94,0.05)', padding: '0.35rem 0.65rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
              {paymentStatus.transactionId}
            </code>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Order</span>
            <span>{paymentStatus.orderId}</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Amount</span>
            <span>Rs. {paymentStatus.amount.toFixed(2)}</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Currency</span>
            <span>{paymentStatus.currency}</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Status</span>
            {(() => {
              let badgeClass = 'badge-gray';
              if (paymentStatus.status === 'completed') badgeClass = 'badge-green';
              else if (paymentStatus.status === 'failed') badgeClass = 'badge-red';
              else if (paymentStatus.status === 'pending') badgeClass = 'badge-yellow';
              return (
                <span className={`badge ${badgeClass}`}>
                  {paymentStatus.status.toUpperCase()}
                </span>
              );
            })()}
          </div>
          {paymentStatus.payHereId && (
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>PayHere ID</span>
              <span style={{ fontSize: '0.85rem' }}>{paymentStatus.payHereId}</span>
            </div>
          )}
          {paymentStatus.completedAt && (
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Completed At</span>
              <span style={{ fontSize: '0.85rem' }}>
                {new Date(paymentStatus.completedAt).toLocaleString()}
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
