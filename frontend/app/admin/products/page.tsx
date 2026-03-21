"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi, InventoryItem } from "@/lib/inventory-api";
import styles from "../admin.module.css";
import listStyles from "./products-list.module.css";

export default function AdminProductsPage() {
    const token = getAccessToken();
    const router = useRouter();
    
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await inventoryApi.getItems();
            setItems(data.items || []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load inventory";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent opening the modal
        if (!token) return;
        if (!confirm("Are you sure you want to delete this item?")) return;
        
        try {
            await inventoryApi.deleteItem(token, id);
            setItems(items.filter(item => item._id !== id));
            if (selectedProduct?._id === id) setSelectedProduct(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete item";
            alert(message);
        }
    };

    const handleEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent opening the modal immediately
        router.push(`/admin/products/${id}`);
    };

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className={styles.title}>Products & Inventory</h1>
                    <p className={styles.subtitle}>
                        Manage your catalog, stock levels, and SKUs.
                    </p>
                </div>
                <div className={styles.headerActions} style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => router.push("/admin/dashboard")}
                    >
                        ← Back to Dashboard
                    </button>
                    <button 
                        className={`btn btn-primary`}
                        onClick={() => router.push("/admin/products/new")}
                    >
                        ➕ Add Product
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className={styles.tableSection}>
                <div className={styles.tableHeader} style={{ flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                    <h2 className={styles.tableTitle} style={{ margin: 0 }}>Inventory List</h2>
                    <div className={listStyles.searchWrapper}>
                        <span className={listStyles.searchIcon}>🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by SKU or Name..." 
                            className={listStyles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className={styles.tableCard}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)' }}>Loading inventory...</div>
                    ) : filteredItems.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
                            No products found. Click &quot;Add Product&quot; to get started.
                        </div>
                    ) : (
                        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--ink-muted)' }}>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>SKU</th>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Product Name</th>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Price</th>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Stock</th>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => {
                                    const categoryName = typeof item.category === 'object' ? item.category?.name : item.category;
                                    const isLowStock = item.stock <= (item.lowStockThreshold || 5);
                                    const isOutOfStock = item.stock === 0;
                                    
                                    return (
                                        <tr 
                                            key={item._id} 
                                            className={listStyles.tableRow}
                                            onClick={() => setSelectedProduct(item)}
                                            style={{ borderBottom: '1px solid var(--border)' }}
                                        >
                                            <td style={{ padding: '1rem' }}>
                                                <code style={{ background: 'var(--surface-2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', color: 'var(--ink-muted)' }}>{item.sku}</code>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <strong style={{ display: 'block', color: 'var(--ink)' }}>{item.name}</strong>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '4px', fontWeight: 500 }}>{categoryName || 'Uncategorized'}</div>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--ink)' }}>${item.price.toFixed(2)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.stock}</span> <span style={{ color: 'var(--ink-muted)', fontSize: '0.9em' }}>{item.unit}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {!item.isActive ? (
                                                    <span style={{ color: '#4b5563', background: '#f3f4f6', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500 }}>Inactive</span>
                                                ) : isOutOfStock ? (
                                                    <span style={{ color: '#dc2626', background: '#fee2e2', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500 }}>Out of Stock</span>
                                                ) : isLowStock ? (
                                                    <span style={{ color: '#d97706', background: '#fef3c7', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500 }}>Low Stock</span>
                                                ) : (
                                                    <span style={{ color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500 }}>In Stock</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button 
                                                    onClick={(e) => handleEdit(e, item._id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', marginRight: '1rem', fontWeight: 'bold' }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, item._id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Slide-Over Overlay */}
            {selectedProduct && (
                <div className={listStyles.overlay} onClick={() => setSelectedProduct(null)}>
                    <div className={listStyles.panel} onClick={(e) => e.stopPropagation()}>
                        <div className={listStyles.panelHeader}>
                            <div>
                                <h3 className={listStyles.panelTitle}>{selectedProduct.name}</h3>
                                <div className={listStyles.panelSku}>{selectedProduct.sku}</div>
                            </div>
                            <button className={listStyles.closeButton} onClick={() => setSelectedProduct(null)}>✕</button>
                        </div>
                        
                        <div className={listStyles.panelContent}>
                            <div className={listStyles.detailCard}>
                                <div className={listStyles.detailRow}>
                                    <span className={listStyles.detailLabel}>Status</span>
                                    <span className={listStyles.detailValue}>
                                        {selectedProduct.isActive ? '✅ Active on Storefront' : '❌ Hidden from Customers'}
                                    </span>
                                </div>
                                <div className={listStyles.detailRow}>
                                    <span className={listStyles.detailLabel}>Category</span>
                                    <span className={listStyles.detailValue}>
                                        {typeof selectedProduct.category === 'object' ? selectedProduct.category?.name : selectedProduct.category || 'Uncategorized'}
                                    </span>
                                </div>
                            </div>

                            <div className={listStyles.detailCard}>
                                <div className={listStyles.detailRow}>
                                    <span className={listStyles.detailLabel}>Pricing</span>
                                    <span className={listStyles.detailValue} style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                                        ${selectedProduct.price.toFixed(2)}
                                    </span>
                                </div>
                                {selectedProduct.compareAtPrice && (
                                    <div className={listStyles.detailRow}>
                                        <span className={listStyles.detailLabel}>Compare At Price</span>
                                        <span className={listStyles.detailValue} style={{ textDecoration: 'line-through', color: 'var(--ink-muted)' }}>
                                            ${selectedProduct.compareAtPrice.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={listStyles.detailCard}>
                                <div className={listStyles.detailRow}>
                                    <span className={listStyles.detailLabel}>Available Stock</span>
                                    <span className={listStyles.detailValue}>
                                        {selectedProduct.stock} {selectedProduct.unit}
                                    </span>
                                </div>
                                <div className={listStyles.detailRow}>
                                    <span className={listStyles.detailLabel}>Low Stock Alert</span>
                                    <span className={listStyles.detailValue}>
                                        Trigger below {selectedProduct.lowStockThreshold || 10}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)', fontSize: '0.95rem' }}>Full Description</h4>
                                <div className={listStyles.descriptionBox}>
                                    {selectedProduct.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No product description provided.</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className={listStyles.panelFooter}>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setSelectedProduct(null)}
                            >
                                Close Info
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={(e) => handleEdit(e, selectedProduct._id)}
                            >
                                ✏️ Edit Product details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
