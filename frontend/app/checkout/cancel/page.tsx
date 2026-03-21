import React from "react";
import Link from "next/link";
import styles from "../checkout.module.css";

export default function CheckoutCancelPage() {
  return (
    <main className={styles.wrap}>
      <section className={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '0.75rem'
          }}>
            ⏸️
          </div>
        </div>

        <h1 className={styles.title}>Payment Cancelled</h1>
        <p className={styles.sub}>You exited the PayHere payment process. No charges were made.</p>

        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--r-lg)',
          padding: '1rem',
          marginBottom: '0.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
          <div>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.95rem' }}>What happened?</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-subtle)' }}>
              You returned from the PayHere payment gateway without completing the transaction.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/customer/payments" className="btn btn-primary" style={{ flex: 1 }}>
            ↻ Try Payment Again
          </Link>
          <Link href="/customer/dashboard" className="btn btn-secondary" style={{ flex: 1 }}>
            Go to Dashboard →
          </Link>
        </div>
      </section>
    </main>
  );
}
