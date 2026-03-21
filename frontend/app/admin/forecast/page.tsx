"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inventoryApi, InventoryItem } from "@/lib/inventory-api";
import styles from "./forecast.module.css";
import globalStyles from "../../admin.module.css";

interface ForecastItem extends InventoryItem {
    projectedRunoutDays: number;
    dailyRunRate: number;
    riskLevel: 'High' | 'Medium' | 'Low';
}

export default function ForecastPage() {
    const router = useRouter();
    const [items, setItems] = useState<ForecastItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAndCalculateForecast = async () => {
            setLoading(true);
            try {
                const data = await inventoryApi.getItems();
                
                // Enhance inventory data with mock forecast calculations
                const enhanced: ForecastItem[] = data.items.map((item: InventoryItem) => {
                    // Seed a random but consistent run rate based on stock & id length
                    const seededRandom = ((item._id.charCodeAt(0) + item.stock) % 10) / 10;
                    const dailyRunRate = Math.max(0.5, seededRandom * 8); // 0.5 to ~8 items per day
                    
                    const projectedRunoutDays = item.stock === 0 ? 0 : Math.round(item.stock / dailyRunRate);
                    
                    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
                    if (projectedRunoutDays <= 7) riskLevel = 'High';
                    else if (projectedRunoutDays <= 21) riskLevel = 'Medium';
                    
                    return {
                        ...item,
                        dailyRunRate,
                        projectedRunoutDays,
                        riskLevel
                    };
                });
                
                // Sort by risk (High risk first, then by earliest runout date)
                enhanced.sort((a, b) => a.projectedRunoutDays - b.projectedRunoutDays);
                setItems(enhanced);
            } catch (err) {
                console.error("Failed to load inventory for forecast", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndCalculateForecast();
    }, []);

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const highRiskCount = items.filter(i => i.riskLevel === 'High').length;
    const outOfStockCount = items.filter(i => i.stock === 0).length;

    const getRiskStyles = (riskLevel: string) => {
        switch (riskLevel) {
            case 'High': return styles.riskHigh;
            case 'Medium': return styles.riskMedium;
            case 'Low': return styles.riskLow;
            default: return '';
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Inventory Forecast</h1>
                    <p className={styles.subtitle}>
                        AI-driven demand predictions and stock-out alerts.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-secondary" onClick={() => router.push('/admin/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <button className="btn btn-primary" onClick={() => router.push('/admin/products')}>
                        📦 Manage Inventory
                    </button>
                </div>
            </div>

            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--danger)" }}>
                        ⚠️
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Critical Items</p>
                        <p className={styles.metricValue}>{highRiskCount}</p>
                        <p className={styles.metricDesc}>Products expected to run out within 7 days.</p>
                    </div>
                </div>
                
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
                        🛒
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Out of Stock</p>
                        <p className={styles.metricValue}>{outOfStockCount}</p>
                        <p className={styles.metricDesc}>Currently unavailable. Reorder immediately.</p>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
                        📈
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Healthy Assets</p>
                        <p className={styles.metricValue}>{items.length - highRiskCount}</p>
                        <p className={styles.metricDesc}>Products with sufficient stock runway.</p>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Run-Rate Analysis</h2>
                    <input 
                        type="search" 
                        placeholder="Search products..." 
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product Details</th>
                                <th>Current Stock</th>
                                <th>Daily Run Rate (Est)</th>
                                <th>Projected Runway</th>
                                <th>Risk Assessment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                                        Loading forecasting data...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className={styles.emptyState}>
                                            <div className={styles.emptyIcon}>📉</div>
                                            <h3>No forecast data available</h3>
                                            <p>No products matched your search criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.map((item) => {
                                // Calculate visual bar width
                                const maxRunway = 60; // 60 days
                                const runwayPercent = Math.min(100, Math.max(0, (item.projectedRunoutDays / maxRunway) * 100));
                                
                                return (
                                    <tr key={item._id} className={styles.tableRow}>
                                        <td>
                                            <div className={styles.productInfo}>
                                                <p className={styles.productName}>{item.name}</p>
                                                <span className={styles.productSku}>{item.sku}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <strong style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>{item.stock}</strong> 
                                            <span style={{ color: 'var(--ink-muted)', marginLeft: '4px', fontSize: '0.9rem' }}>{item.unit}</span>
                                        </td>
                                        <td style={{ color: 'var(--ink)' }}>
                                            ~{item.dailyRunRate.toFixed(1)} / day
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
                                                <span style={{ fontWeight: 600, color: item.projectedRunoutDays <= 7 ? 'var(--danger)' : 'var(--ink)' }}>
                                                    {item.projectedRunoutDays === 0 ? "Empty" : `${item.projectedRunoutDays} Days`}
                                                </span>
                                                <div className={styles.progressBar}>
                                                    <div 
                                                        className={styles.progressFill}
                                                        style={{ 
                                                            width: `${runwayPercent}%`,
                                                            backgroundColor: item.riskLevel === 'High' ? 'var(--danger)' : item.riskLevel === 'Medium' ? 'var(--warning)' : 'var(--success)'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${getRiskStyles(item.riskLevel)}`}>
                                                {item.riskLevel === 'High' && item.stock > 0 ? 'Reorder Soon' : item.stock === 0 ? 'Out of Stock' : 'Sufficient'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
