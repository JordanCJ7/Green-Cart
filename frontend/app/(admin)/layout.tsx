"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./admin.module.css";

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/products", label: "Products", icon: "🥬" },
    { href: "/admin/orders", label: "Orders", icon: "📦" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else if (user.role !== "admin") router.push("/dashboard");
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner-lg" />
            </div>
        );
    }

    if (!user || user.role !== "admin") return null;

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarLogo}>🛒</span>
                    <div>
                        <span className={styles.sidebarBrand}>Green-Cart</span>
                        <span className={styles.adminBadge}>Admin</span>
                    </div>
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
                            <span className="badge badge-blue">Admin</span>
                        </div>
                    </div>
                    <button
                        id="admin-logout"
                        className={`btn btn-ghost btn-full ${styles.logoutBtn}`}
                        onClick={logout}
                    >
                        🚪 Sign out
                    </button>
                </div>
            </aside>

            <div className={styles.main}>
                <header className={styles.topbar}>
                    <h2 className={styles.pageHeading}>
                        {NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Admin"}
                    </h2>
                    <div className={styles.topbarRight}>
                        <span className={styles.adminLabel}>Admin Panel</span>
                    </div>
                </header>
                <main className={styles.content}>{children}</main>
            </div>
        </div>
    );
}
