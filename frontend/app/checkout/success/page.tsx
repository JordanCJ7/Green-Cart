"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetPaymentStatus, type PaymentStatusResponse } from "@/lib/payment";
import styles from "../checkout.module.css";

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const txnId = localStorage.getItem("gc_last_txn_id");
    if (!txnId) {
      setError("No recent transaction found.");
      setLoading(false);
      return;
    }

    apiGetPaymentStatus(txnId)
      .then((res) => {
        setStatus(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load payment status.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.wrap}>
      <section className={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '0.75rem',
            animation: 'bounce 0.6s ease-out'
          }}>
            ✅
          </div>
        </div>

        <h1 className={styles.title}>Payment Successful!</h1>
        <p className={styles.sub}>Your transaction has been completed successfully.</p>

        {loading && <p style={{ textAlign: 'center', color: 'var(--ink-subtle)' }}>🔄 Verifying payment status...</p>}

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {status && (
          <div className={styles.meta}>
            <p>
              <strong>Transaction ID:</strong> <code style={{ background: 'rgba(34,197,94,0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{status.transactionId}</code>
            </p>
            <p>
              <strong>Order ID:</strong> {status.orderId}
            </p>
            <p>
              <strong>Amount:</strong> Rs. {status.amount.toFixed(2)} {status.currency}
            </p>
            <p>
              <strong>Status:</strong> <span className="badge badge-green">{status.status.toUpperCase()}</span>
            </p>
            {status.payHereId && (
              <p>
                <strong>Payment ID:</strong> {status.payHereId}
              </p>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/customer/payments" className="btn btn-primary" style={{ flex: 1 }}>
            ← Back to Payments
          </Link>
          <Link href="/customer/dashboard" className="btn btn-secondary" style={{ flex: 1 }}>
            Go to Dashboard →
          </Link>
        </div>
      </section>
    </main>
  );
}
