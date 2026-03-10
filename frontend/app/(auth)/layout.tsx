import React from "react";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.root}>
            <div className={styles.glow} aria-hidden />
            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🛒</span>
                    <span className={styles.logoText}>Green-Cart</span>
                </div>
                {children}
            </div>
        </div>
    );
}
