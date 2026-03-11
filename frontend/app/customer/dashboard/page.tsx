"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import styles from "./dashboard.module.css";

const STATS = [
    { icon: "📦", label: "Total Orders", value: "12", change: "+3 this month", up: true, bg: "#f0fdf4" },
    { icon: "❤️", label: "Wishlist Items", value: "7", change: "+1 this week", up: true, bg: "#fdf4ff" },
    { icon: "🌿", label: "Eco Points", value: "340", change: "+50 earned", up: true, bg: "#eff6ff" },
    { icon: "💰", label: "Total Saved", value: "$28.50", change: "From discounts", up: true, bg: "#fefce8" },
];

const RECENT_ORDERS = [
    { id: "#GC-1042", items: "Organic Apples, Spinach×2", date: "Mar 9, 2026", status: "Delivered", statusClass: "badge-green" },
    { id: "#GC-1039", items: "Avocados×3, Almond Milk", date: "Mar 6, 2026", status: "Processing", statusClass: "badge-yellow" },
    { id: "#GC-1031", items: "Carrots, Broccoli, Kale", date: "Mar 1, 2026", status: "Delivered", statusClass: "badge-green" },
    { id: "#GC-1024", items: "Free-Range Eggs×2, Oats", date: "Feb 24, 2026", status: "Delivered", statusClass: "badge-green" },
];

export default function CustomerDashboardPage() {
    const { user } = useAuth();

    return (
        <div className={styles.page}>
            {/* Welcome banner */}
            <div className={styles.banner}>
                <div>
                    <h1 className={styles.bannerTitle}>
                        Good evening, {user?.email.split("@")[0]} 🌿
                    </h1>
                    <p className={styles.bannerSub}>
                        Your fresh groceries are just a click away. Here&apos;s what&apos;s happening.
                    </p>
                </div>
                <button className="btn btn-primary btn-lg" id="shop-now">
                    🛍️ Shop Now
                </button>
            </div>

            {/* Stats grid */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Overview</h2>
                <div className={styles.statsGrid}>
                    {STATS.map((s) => (
                        <div key={s.label} className="stat-card">
                            <div className="stat-icon" style={{ background: s.bg }}>
                                {s.icon}
                            </div>
                            <div>
                                <p className="stat-label">{s.label}</p>
                                <p className="stat-value">{s.value}</p>
                                <p className={`stat-change ${s.up ? "up" : "down"}`}>{s.change}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent orders table */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Orders</h2>
                    <a href="/customer/orders" className="link-primary">
                        View all →
                    </a>
                </div>
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Items</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_ORDERS.map((order) => (
                                <tr key={order.id}>
                                    <td className={styles.orderId}>{order.id}</td>
                                    <td>{order.items}</td>
                                    <td className={styles.orderDate}>{order.date}</td>
                                    <td>
                                        <span className={`badge ${order.statusClass}`}>{order.status}</span>
                                    </td>
                                    <td>
                                        <button className={`btn btn-ghost btn-sm`}>Track</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Quick actions */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.quickGrid}>
                    {[
                        { icon: "🥬", label: "Browse Produce", href: "/shop" },
                        { icon: "❤️", label: "My Wishlist", href: "/customer/wishlist" },
                        { icon: "📦", label: "My Orders", href: "/customer/orders" },
                        { icon: "👤", label: "My Profile", href: "/customer/profile" },
                    ].map((q) => (
                        <a key={q.label} href={q.href} className={styles.quickCard}>
                            <span className={styles.quickIcon}>{q.icon}</span>
                            <span className={styles.quickLabel}>{q.label}</span>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
}
