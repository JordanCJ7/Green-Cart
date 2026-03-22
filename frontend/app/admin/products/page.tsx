"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Plus, Search, SquarePen, XCircle, CheckCircle2 } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi, InventoryItem } from "@/lib/inventory-api";
import listStyles from "./products-list.module.css";
import styles from "./products-page.module.css";

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

    const renderProductContent = () => {
        if (loading) {
            return <div className={styles.loadingState}>Loading inventory...</div>;
        }
        if (filteredItems.length === 0) {
            return <div className={styles.emptyState}>No products found. Click Add Product to get started.</div>;
        }
        return (
            <table className={styles.table}>
                <thead>
                    <tr className={styles.tableHead}>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map(item => {
                        const isLowStock = item.stock <= (item.lowStockThreshold || 5);
                        const isOutOfStock = item.stock === 0;
                        
                        const getStatusBadge = (): React.ReactNode => {
                            if (!item.isActive) {
                                return <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactive</span>;
                            }
                            if (isOutOfStock) {
                                return <span className={`${styles.badge} ${styles.badgeOut}`}>Out of Stock</span>;
                            }
                            if (isLowStock) {
                                return <span className={`${styles.badge} ${styles.badgeLow}`}>Low Stock</span>;
                            }
                            return <span className={`${styles.badge} ${styles.badgeIn}`}>In Stock</span>;
                        };
                        
                        return (
                            <tr 
                                key={item._id} 
                                className={listStyles.tableRow}
                                onClick={() => setSelectedProduct(item)}
                            >
                                <td data-label="SKU" className={styles.tableCell}>
                                    <code className={styles.skuCode}>{item.sku}</code>
                                </td>
                                <td data-label="Product" className={styles.tableCell}>
                                    <strong className={styles.itemName}>{item.name}</strong>
                                    <div className={styles.itemMeta}>SKU: {item.sku}</div>
                                </td>
                                <td data-label="Price" className={`${styles.tableCell} ${styles.priceCell}`}>${item.price.toFixed(2)}</td>
                                <td data-label="Stock" className={styles.tableCell}>
                                    <span className={styles.stockValue}>{item.stock}</span> <span className={styles.stockUnit}>{item.unit}</span>
                                </td>
                                <td data-label="Status" className={styles.tableCell}>
                                    {getStatusBadge()}
                                </td>
                                <td data-label="Actions" className={`${styles.tableCell} ${styles.actionsCell}`}>
                                    <div className={styles.rowActions}>
                                    <button 
                                        onClick={(e) => handleEdit(e, item._id)}
                                        className={`${styles.rowButton} ${styles.editBtn}`}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, item._id)}
                                        className={`${styles.rowButton} ${styles.deleteBtn}`}
                                    >
                                        Delete
                                    </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Products & Inventory</h1>
                    <p className={styles.subtitle}>
                        Manage product details, pricing, stock levels, and SKUs.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => router.push("/admin/dashboard")}
                    >
                        <ArrowLeft size={15} />
                        <span>Back to Dashboard</span>
                    </button>
                    <button 
                        className={`btn btn-primary`}
                        onClick={() => router.push("/admin/products/new")}
                    >
                        <Plus size={15} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className={`alert alert-error ${styles.errorAlert}`}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Product List</h2>
                    <div className={listStyles.searchWrapper}>
                        <span className={listStyles.searchIcon}><Search size={14} /></span>
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
                    {renderProductContent()}
                </div>
            </div>

            {/* Slide-Over Dialog */}
            {selectedProduct && (
                <dialog className={listStyles.overlay} open onCancel={() => setSelectedProduct(null)}>
                    <section className={listStyles.panel} aria-label="Product details">
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
                                        {selectedProduct.isActive ? (
                                            <span className={styles.statusInline}>
                                                <CheckCircle2 size={14} /> Active on Storefront
                                            </span>
                                        ) : (
                                            <span className={styles.statusInline}>
                                                <XCircle size={14} /> Hidden from Customers
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className={listStyles.detailCard}>
                                <div className={listStyles.detailRow}>
                                    <span className={listStyles.detailLabel}>Pricing</span>
                                    <span className={`${listStyles.detailValue} ${styles.priceEmphasis}`}>
                                        ${selectedProduct.price.toFixed(2)}
                                    </span>
                                </div>
                                {selectedProduct.compareAtPrice && (
                                    <div className={listStyles.detailRow}>
                                        <span className={listStyles.detailLabel}>Compare At Price</span>
                                        <span className={`${listStyles.detailValue} ${styles.comparePrice}`}>
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
                                <h4 className={styles.descriptionTitle}>Full Description</h4>
                                <div className={listStyles.descriptionBox}>
                                    {selectedProduct.description || <span className={styles.descriptionEmpty}>No product description provided.</span>}
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
                                <SquarePen size={15} />
                                <span>Edit Product Details</span>
                            </button>
                        </div>
                    </section>
                </dialog>
            )}
        </div>
    );
}
