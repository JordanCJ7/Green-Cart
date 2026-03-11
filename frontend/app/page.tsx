import React from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export default function Home() {
  return (
    <main className={styles.root}>
      {/* Ambient orbs */}
      <div className={styles.orb1} aria-hidden />
      <div className={styles.orb2} aria-hidden />

      <div className={styles.hero}>
        {/* Badge */}
        <div className={styles.badge}>
          <span>🌿</span> Fresh. Organic. Fast.
        </div>

        <h1 className={styles.headline}>
          Groceries that care<br />
          for you &amp; the planet
        </h1>
        <p className={styles.sub}>
          Shop seasonal produce, organic goods, and everyday essentials — delivered to
          your door in under 2 hours.
        </p>

        <div className={styles.cta}>
          <Link href="/register" id="landing-register" className="btn btn-primary btn-lg">
            🛒 Start Shopping Free
          </Link>
          <Link href="/login" id="landing-login" className="btn btn-secondary btn-lg">
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className={styles.pills}>
          {["🚀 2-hr delivery", "🌱 100% organic options", "♻️ Eco packaging", "💳 Secure checkout"].map((p) => (
            <span key={p} className={styles.pill}>{p}</span>
          ))}
        </div>
      </div>

      {/* Category cards */}
      <section className={styles.categories}>
        {[
          { icon: "🥬", label: "Vegetables" },
          { icon: "🍎", label: "Fruits" },
          { icon: "🥛", label: "Dairy" },
          { icon: "🌾", label: "Grains" },
          { icon: "🥩", label: "Proteins" },
          { icon: "🍵", label: "Beverages" },
        ].map((c) => (
          <Link href="/login" key={c.label} className={styles.catCard}>
            <span className={styles.catIcon}>{c.icon}</span>
            <span className={styles.catLabel}>{c.label}</span>
          </Link>
        ))}
      </section>

      <footer className={styles.footer}>
        <p>
          © 2026 Green-Cart&nbsp;&nbsp;·&nbsp;&nbsp;
          <Link href="#">Privacy</Link>&nbsp;&nbsp;·&nbsp;&nbsp;
          <Link href="#">Terms</Link>
        </p>
      </footer>
    </main>
  );
}
