import React from "react";
import Link from "next/link";
import { ArrowRight, Ban, Info, RotateCcw } from "lucide-react";
import styles from "../checkout.module.css";

export default function CheckoutCancelPage() {
  return (
    <main className={styles.wrap}>
      <section className={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <Ban size={42} style={{ margin: '0 auto 0.75rem', color: '#b23b3b' }} />
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
          <Info size={18} color="#9a3a3a" />
          <div>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.95rem' }}>What happened?</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-subtle)' }}>
              You returned from the PayHere payment gateway without completing the transaction.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/customer/payments" className="btn btn-primary" style={{ flex: 1 }}>
            <RotateCcw size={15} />
            <span>Try Payment Again</span>
          </Link>
          <Link href="/customer/dashboard" className="btn btn-secondary" style={{ flex: 1 }}>
            <span>Go to Dashboard</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
