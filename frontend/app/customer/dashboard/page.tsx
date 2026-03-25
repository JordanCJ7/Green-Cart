"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { apiGetPaymentStatus, type PaymentStatusResponse } from "@/lib/payment";
import { inventoryApi, type InventoryItem } from "@/lib/inventory-api";
import {
    Activity,
    ArrowRight,
    BadgeDollarSign,
    Boxes,
    CircleDollarSign,
    Compass,
    CreditCard,
    Layers3,
    PackageCheck,
    ShoppingBasket,
    Sparkles,
    Star,
    TrendingUp,
    UserCircle,
} from "lucide-react";
import styles from "./dashboard.module.css";

type StatTone = "up" | "down" | "neutral";

interface DashboardStat {
    icon: React.ReactNode;
    label: string;
    value: string;
    note: string;
    tone: StatTone;
}

const CATEGORY_SHOWCASE_IMAGES: Record<string, string> = {
    fruits: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80",
    vegetables: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
    bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    beverages: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80",
    snacks: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80",
    meat: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80",
    seafood: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?auto=format&fit=crop&w=1200&q=80",
    frozen: "https://images.unsplash.com/photo-1625944525533-473f1f45b314?auto=format&fit=crop&w=1200&q=80",
    pantry: "https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=1200&q=80",
};

const FALLBACK_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1200&q=80";

function normalizeCategory(value: string): string {
    return value.trim().toLowerCase();
}

function getCategoryShowcaseImage(category: string): string {
    return CATEGORY_SHOWCASE_IMAGES[normalizeCategory(category)] ?? FALLBACK_CATEGORY_IMAGE;
}

function getPaymentBadgeClass(status: PaymentStatusResponse["status"]): string {
    if (status === "completed") return "badge-green";
    if (status === "failed" || status === "cancelled" || status === "expired") return "badge-red";
    if (status === "pending") return "badge-yellow";
    return "badge-gray";
}

function getToneClass(tone: StatTone, stylesMap: Record<string, string>): string {
    if (tone === "up") return stylesMap.up;
    if (tone === "down") return stylesMap.down;
    return stylesMap.neutral;
}

export default function CustomerDashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [categoryCount, setCategoryCount] = useState(0);
    const [lastPayment, setLastPayment] = useState<PaymentStatusResponse | null>(null);

    useEffect(() => {
        let active = true;

        async function loadDashboardData() {
            setLoading(true);
            setError(null);

            try {
                const [itemsResult, categoriesResult] = await Promise.all([
                    inventoryApi.getItems({ limit: "5", isActive: "true", inStock: "true", sort: "-updatedAt" }),
                    inventoryApi.getCategories(),
                ]);

                if (!active) return;

                setItems(itemsResult.items ?? []);
                setTotalItems(itemsResult.pagination?.total ?? 0);
                setCategoryCount(categoriesResult.categories?.length ?? 0);

                const txnId = localStorage.getItem("gc_last_txn_id");
                if (txnId) {
                    try {
                        const paymentStatus = await apiGetPaymentStatus(txnId);
                        if (active) {
                            setLastPayment(paymentStatus);
                        }
                    } catch {
                        if (active) {
                            setLastPayment(null);
                        }
                    }
                }
            } catch (err) {
                if (!active) return;
                const message = err instanceof Error ? err.message : "Failed to load dashboard data.";
                setError(message);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadDashboardData();

        return () => {
            active = false;
        };
    }, []);

    const memberSince = useMemo(() => {
        if (!user?.createdAt) return "-";
        return new Date(user.createdAt).toLocaleDateString();
    }, [user?.createdAt]);

    const paymentTone: StatTone = useMemo(() => {
        if (!lastPayment) return "neutral";
        return lastPayment.status === "completed" ? "up" : "down";
    }, [lastPayment]);

    const stats = useMemo<DashboardStat[]>(() => {
        return [
            {
                icon: <Boxes size={18} />,
                label: "Available Products",
                value: totalItems.toLocaleString(),
                note: "Inventory service",
                tone: "neutral",
            },
            {
                icon: <Layers3 size={18} />,
                label: "Categories",
                value: categoryCount.toString(),
                note: "Predefined catalog",
                tone: "neutral",
            },
            {
                icon: <CreditCard size={18} />,
                label: "Last Payment",
                value: lastPayment ? lastPayment.status.toUpperCase() : "N/A",
                note: lastPayment ? `Order ${lastPayment.orderId}` : "No recent transaction",
                tone: paymentTone,
            },
            {
                icon: <UserCircle size={18} />,
                label: "Member Since",
                value: memberSince,
                note: user?.email ?? "-",
                tone: "neutral",
            },
        ];
    }, [categoryCount, lastPayment, memberSince, paymentTone, totalItems, user?.email]);

    const firstName = user?.email ? user.email.split("@")[0] : "Customer";
    const todayLabel = new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });

    const featuredItem = items.length > 0 ? items[0] : null;

    const maxVisibleStock = useMemo(() => {
        const maxStock = items.reduce((max, item) => Math.max(max, item.stock), 0);
        return Math.max(1, maxStock);
    }, [items]);

    const categoryBreakdown = useMemo(() => {
        const bucket: Record<string, { count: number }> = {};
        for (const item of items) {
            const existing = bucket[item.category];
            if (!existing) {
                bucket[item.category] = { count: 1 };
            } else {
                existing.count += 1;
            }
        }
        return Object.entries(bucket)
            .map(([category, data]) => ({ category, count: data.count, image: getCategoryShowcaseImage(category) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [items]);

    const freshPicksContent = () => {
        if (loading) {
            return <div className={styles.loadingState}>Loading product highlights...</div>;
        }

        if (items.length === 0) {
            return <div className={styles.emptyState}>No active products available right now.</div>;
        }

        return (
            <div className={styles.productGrid}>
                {items.map((item) => {
                    const stockRatio = Math.min(100, Math.round((item.stock / maxVisibleStock) * 100));

                    return (
                        <article key={item._id} className={styles.productCard}>
                            <div className={styles.productMedia}>
                                {item.images?.[0] ? (
                                    <Image src={item.images[0]} alt={item.name} fill className={styles.productImage} />
                                ) : (
                                    <div className={styles.productFallback}>{item.name.slice(0, 1).toUpperCase()}</div>
                                )}
                            </div>
                            <div className={styles.productHead}>
                                <span className={styles.productCategory}>{item.category}</span>
                                <span className={styles.productStock}>{item.stock} in stock</span>
                            </div>

                            <h3 className={styles.productTitle}>{item.name}</h3>
                            <p className={styles.productPrice}>LKR {item.price.toFixed(2)}</p>

                            <div className={styles.stockTrack} aria-label="Stock ratio">
                                <span className={styles.stockFill} style={{ width: `${stockRatio}%` }} />
                            </div>

                            <div className={styles.productActions}>
                                <Link href={`/products/${item._id}`} className="btn btn-primary btn-sm">
                                    <span>View Product</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Welcome back, {firstName}</h1>
                    <p className={styles.subtitle}>
                        Fresh account overview powered by live inventory and payment data.
                    </p>
                    <div className={styles.headerMeta}>
                        <span className={styles.metaPill}>Member since {memberSince}</span>
                        <span className={styles.metaPill}>{todayLabel}</span>
                    </div>
                </div>
                <Link href="/products" className="btn btn-primary btn-sm">
                    <ShoppingBasket size={16} />
                    <span>Shop Now</span>
                </Link>
            </div>

            {error ? (
                <div className={`alert alert-error ${styles.errorAlert}`}>{error}</div>
            ) : null}

            <section className={styles.sectionShell}>
                <div className={styles.sectionHeadRow}>
                    <h2 className={styles.sectionTitle}>Overview</h2>
                    <p className={styles.sectionSubtle}>Live service snapshot</p>
                </div>
                <div className={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <div key={stat.label} className={`${styles.statCard} ${styles[`statCard${index + 1}`] || ""}`}>
                            <div className={styles.statIcon}>{stat.icon}</div>
                            <div>
                                <p className={styles.statLabel}>{stat.label}</p>
                                <p className={styles.statValue}>{loading ? "..." : stat.value}</p>
                                <p className={`${styles.statMeta} ${getToneClass(stat.tone, styles)}`}>
                                    {stat.note}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.spotlightGrid}>
                <article className={styles.spotlightCardPrimary}>
                    {featuredItem?.images?.[0] ? (
                        <div className={styles.spotlightMedia}>
                            <Image src={featuredItem.images[0]} alt={featuredItem.name} fill className={styles.spotlightImage} />
                        </div>
                    ) : null}
                    <div className={styles.spotlightIcon}><Sparkles size={18} /></div>
                    <p className={styles.spotlightEyebrow}>Today&apos;s Spotlight</p>
                    <h2 className={styles.spotlightTitle}>
                        {featuredItem ? featuredItem.name : "Fresh picks are loading"}
                    </h2>
                    <p className={styles.spotlightText}>
                        {featuredItem
                            ? `Category: ${featuredItem.category} · Stock: ${featuredItem.stock} · Price: LKR ${featuredItem.price.toFixed(2)}`
                            : "We are preparing your personalized highlights from the latest inventory."}
                    </p>
                    <div className={styles.spotlightActions}>
                        {featuredItem ? (
                            <Link href={`/products/${featuredItem._id}`} className="btn btn-primary btn-sm">
                                <PackageCheck size={15} />
                                <span>Open Spotlight Item</span>
                            </Link>
                        ) : (
                            <Link href="/products" className="btn btn-primary btn-sm">
                                <ShoppingBasket size={15} />
                                <span>Explore Products</span>
                            </Link>
                        )}
                    </div>
                </article>

                <article className={styles.spotlightCardSecondary}>
                    <div className={styles.pulseHeader}>
                        <div className={styles.pulseIcon}><Activity size={16} /></div>
                        <p className={styles.pulseTitle}>Payment Pulse</p>
                    </div>
                    <div className={styles.pulseMetric}>
                        <CircleDollarSign size={16} />
                        <strong>
                            {lastPayment
                                ? `${lastPayment.currency} ${lastPayment.amount.toFixed(2)}`
                                : "No recent amount"}
                        </strong>
                    </div>
                    <div className={styles.pulseRow}>
                        <span>Status</span>
                        {lastPayment ? (
                            <span className={`badge ${getPaymentBadgeClass(lastPayment.status)}`}>
                                {lastPayment.status.toUpperCase()}
                            </span>
                        ) : (
                            <span className="badge badge-gray">N/A</span>
                        )}
                    </div>
                    <div className={styles.pulseRow}>
                        <span>Trend</span>
                        <span className={styles.pulseTrend}>
                            <TrendingUp size={13} /> Activity synced
                        </span>
                    </div>
                    <div className={styles.pulseRow}>
                        <span>Next step</span>
                        <Link href="/customer/payments" className={styles.inlineLink}>Open payments</Link>
                    </div>
                </article>
            </section>

            <section className={styles.sectionShell}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>Fresh Picks</h2>
                    <Link href="/products" className="btn btn-secondary btn-sm">
                        <span>Browse all</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
                <div className={styles.tableCard}>
                    {freshPicksContent()}
                </div>
            </section>

            <section className={styles.sectionShell}>
                <div className={styles.sectionHeadRow}>
                    <h2 className={styles.sectionTitle}>Category Vibe Board</h2>
                    <p className={styles.sectionSubtle}>Showcased with curated visuals for each category</p>
                </div>
                {loading ? <div className={styles.loadingState}>Preparing category board...</div> : null}
                {!loading && categoryBreakdown.length === 0 ? (
                    <div className={styles.emptyState}>No category activity yet. Add items to inventory and refresh.</div>
                ) : null}
                {!loading && categoryBreakdown.length > 0 ? (
                    <div className={styles.featureGrid}>
                        {categoryBreakdown.map((entry, index) => (
                            <article key={entry.category} className={styles.featureCard}>
                                <div className={styles.featureMedia}>
                                    <Image src={entry.image} alt={entry.category} fill className={styles.featureImage} />
                                </div>
                                <div className={styles.featureContent}>
                                    <div className={styles.featureTopRow}>
                                        <span className={styles.categoryRank}>#{index + 1}</span>
                                    </div>
                                    <p className={styles.featureTitle}>{entry.category}</p>
                                    <p className={styles.featureMeta}>{entry.count} active product{entry.count > 1 ? "s" : ""}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </section>

            <section className={styles.sectionShell}>
                <div className={styles.sectionHeadRow}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                    <p className={styles.sectionSubtle}>Jump to common tasks</p>
                </div>
                <div className={styles.featureGrid}>
                    {[
                        {
                            icon: <ShoppingBasket size={18} />,
                            label: "Browse Products",
                            desc: "Explore active grocery inventory",
                            href: "/products",
                        },
                        {
                            icon: <CreditCard size={18} />,
                            label: "Payments",
                            desc: "Continue checkout and track payment",
                            href: "/customer/payments",
                        },
                        {
                            icon: <BadgeDollarSign size={18} />,
                            label: "Checkout",
                            desc: "Review order and complete purchase",
                            href: "/checkout",
                        },
                        {
                            icon: <Sparkles size={18} />,
                            label: "Home Storefront",
                            desc: "See featured products and offers",
                            href: "/",
                        },
                        {
                            icon: <Compass size={18} />,
                            label: "Discover Categories",
                            desc: "Browse by grocery category",
                            href: "/products",
                        },
                        {
                            icon: <Star size={18} />,
                            label: "Featured Deals",
                            desc: "Catch currently highlighted items",
                            href: "/",
                        },
                    ].map((q, index) => (
                        <Link key={q.label} href={q.href} className={styles.featureCard}>
                            <div className={styles.featureContent}>
                                <div className={styles.featureTopRow}>
                                    <span className={`${styles.quickIcon} ${styles[`quickTone${(index % 4) + 1}`] || ""}`}>{q.icon}</span>
                                </div>
                                <p className={styles.featureTitle}>{q.label}</p>
                                <p className={styles.featureMeta}>{q.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
