import React from "react";
import { ShoppingBasket } from "lucide-react";
import StoreHeader from "@/app/components/StoreHeader";
import styles from "./auth.module.css";

interface AuthLayoutProps {
    readonly children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className={styles.root}>
            <StoreHeader />
            <div className={styles.cardWrap}>
                <div className={styles.glow} aria-hidden />
                <div className={styles.card}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}><ShoppingBasket size={20} strokeWidth={2.2} /></span>
                        <span className={styles.logoText}>Green-Cart</span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
