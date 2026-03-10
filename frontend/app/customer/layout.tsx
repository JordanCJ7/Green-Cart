"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./customer.module.css";

const NAV_ITEMS = [
    { href: "/customer/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/customer/orders", label: "My Orders", icon: "📦" },
    { href: "/customer/wishlist", label: "Wishlist", icon: "❤️" },
    { href: "/customer/profile", label: "Profile", icon: "👤" },
];

interface CustomerLayoutProps {
  readonly children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Client-side guard (middleware handles the server-side redirect)
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner-lg" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.shell}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarLogo}>🛒</span>
                    <span className={styles.sidebarBrand}>Green-Cart</span>
                </div>

                <nav className={styles.nav}>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ""}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userChip}>
                        <div className={styles.avatar}>{user.email[0].toUpperCase()}</div>
                        <div className={styles.userInfo}>
                            <p className={styles.userName}>{user.email.split("@")[0]}</p>
                            <span className="badge badge-green">Customer</span>
                        </div>
                    </div>
                    <button
                        id="customer-logout"
                        className={`btn btn-ghost btn-full ${styles.logoutBtn}`}
                        onClick={logout}
                    >
                        🚪 Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={styles.main}>
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <h2 className={styles.pageHeading}>
                            {NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Dashboard"}
                        </h2>
                    </div>
                    <div className={styles.topbarRight}>
                        <span className={styles.greeting}>Hello, {user.email.split("@")[0]} 👋</span>
                    </div>
                </header>

                <main className={styles.content}>{children}</main>
            </div>
        </div>
    );
}
