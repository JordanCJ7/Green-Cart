"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import styles from "./admin-dashboard.module.css";

const STATS = [
    { icon: "👥", label: "Total Users", value: "1,248", change: "+24 today", up: true, bg: "rgba(74,222,128,.12)", color: "#4ade80" },
    { icon: "📦", label: "Total Orders", value: "5,632", change: "+128 this week", up: true, bg: "rgba(251,191,36,.1)", color: "#fbbf24" },
    { icon: "💰", label: "Revenue (MTD)", value: "$34,870", change: "+12% vs last month", up: true, bg: "rgba(129,140,248,.12)", color: "#818cf8" },
    { icon: "🛒", label: "Active Sessions", value: "87", change: "Right now", up: true, bg: "rgba(244,114,182,.1)", color: "#f472b6" },
];

const RECENT_USERS = [
    { email: "alice@example.com", role: "customer", joined: "Mar 10, 2026", status: "Active" },
    { email: "bob@greenmart.io", role: "customer", joined: "Mar 10, 2026", status: "Active" },
    { email: "charlie@corp.com", role: "admin", joined: "Mar 9, 2026", status: "Active" },
    { email: "diana@fresh.co", role: "customer", joined: "Mar 8, 2026", status: "Suspended" },
    { email: "evan@local.net", role: "customer", joined: "Mar 7, 2026", status: "Active" },
];

export default function AdminDashboardPage() {
    const { user } = useAuth();

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>System Overview</h1>
                    <p className={styles.subtitle}>
                        Logged in as <strong>{user?.email}</strong> · Admin access
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`btn btn-secondary btn-sm ${styles.darkBtn}`} id="admin-export">
                        ⬇️ Export
                    </button>
                    <button className={`btn btn-primary btn-sm`} id="admin-invite">
                        ➕ Invite User
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                {STATS.map((s) => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statValue}>{s.value}</p>
                            <p className={`${styles.statChange} ${s.up ? styles.up : styles.down}`}>
                                {s.up ? "↑" : "↓"} {s.change}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Users */}
            <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>Recent Registrations</h2>
                    <button className={`btn btn-secondary btn-sm ${styles.darkBtn}`}>View all users →</button>
                </div>
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_USERS.map((u) => (
                                <tr key={u.email}>
                                    <td className={styles.emailCell}>{u.email}</td>
                                    <td>
                                        <span className={`badge ${u.role === "admin" ? "badge-blue" : "badge-green"}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className={styles.dateCell}>{u.joined}</td>
                                    <td>
                                        <span className={`badge ${u.status === "Active" ? "badge-green" : "badge-red"}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <button className={`btn btn-ghost btn-sm ${styles.darkAction}`}>Edit</button>
                                        <button className={`btn btn-ghost btn-sm ${styles.dangerAction}`}>Suspend</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick admin actions */}
            <div className={styles.quickGrid}>
                {[
                    { icon: "📝", label: "Manage Products", desc: "Edit catalog, prices & stock" },
                    { icon: "🚚", label: "Delivery Zones", desc: "Configure routes and fees" },
                    { icon: "📣", label: "Promotions", desc: "Create discount codes" },
                    { icon: "📈", label: "Analytics", desc: "Sales & user insights" },
                ].map((q) => (
                    <div key={q.label} className={styles.quickCard}>
                        <span className={styles.quickIcon}>{q.icon}</span>
                        <div>
                            <p className={styles.quickLabel}>{q.label}</p>
                            <p className={styles.quickDesc}>{q.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
