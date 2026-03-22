"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { supplierApi, Supplier, SupplierStats, parseCategories } from "@/lib/supplier-api";
import styles from "./suppliers.module.css";

type EditSupplierForm = Omit<Supplier, 'categories'> & {
    categories: string;
    lastDelivery?: string;
};

export default function SuppliersPage() {
    const router = useRouter();
    const token = getAccessToken();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [stats, setStats] = useState<SupplierStats>({ total: 0, active: 0, deliveriesThisWeek: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Add modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: "", contact: "", phone: "", categories: "", notes: "" });

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editSupplier, setEditSupplier] = useState<EditSupplierForm | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [suppliersRes, statsRes] = await Promise.all([
                supplierApi.getAll(),
                supplierApi.getStats()
            ]);
            setSuppliers(suppliersRes.suppliers);
            setStats(statsRes);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load supplier data";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Add ──────────────────────────────────────────────────────
    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) { setError("Not authenticated. Please log in again."); return; }
        if (!newSupplier.name || !newSupplier.contact) return;
        setSaving(true);
        try {
            await supplierApi.create(token, newSupplier);
            setShowModal(false);
            setNewSupplier({ name: "", contact: "", phone: "", categories: "", notes: "" });
            await fetchData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create supplier";
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    // ── Edit ─────────────────────────────────────────────────────
    const openEditModal = (supplier: Supplier) => {
        setEditSupplier({
            ...supplier,
            categories: supplier.categories.join(", "),
            lastDelivery: supplier.lastDelivery
                ? new Date(supplier.lastDelivery).toISOString().split("T")[0]
                : ""
        });
        setShowEditModal(true);
    };

    const handleUpdateSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !editSupplier) return;
        setSaving(true);
        try {
            await supplierApi.update(token, editSupplier._id, {
                name: editSupplier.name,
                contact: editSupplier.contact,
                phone: editSupplier.phone,
                status: editSupplier.status,
                reliability: Number(editSupplier.reliability),
                lastDelivery: editSupplier.lastDelivery || undefined,
                categories: parseCategories(editSupplier.categories),
                notes: editSupplier.notes
            });
            setShowEditModal(false);
            setEditSupplier(null);
            await fetchData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update supplier";
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ───────────────────────────────────────────────────
    const handleDeleteSupplier = async (id: string) => {
        if (!token) { setError("Not authenticated."); return; }
        if (!confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await supplierApi.delete(token, id);
            await fetchData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete supplier";
            setError(message);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Supplier Management</h1>
                    <p className={styles.subtitle}>
                        Manage your vendors, track reliability, and incoming shipments.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-secondary" onClick={() => router.push('/admin/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Add Supplier
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Stat Cards */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
                        🏢
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Total Suppliers</p>
                        <p className={styles.metricValue}>{loading ? "…" : stats.total}</p>
                        <p className={styles.metricDesc}>Registered in system</p>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                        ✅
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Active Vendors</p>
                        <p className={styles.metricValue}>{loading ? "…" : stats.active}</p>
                        <p className={styles.metricDesc}>Currently supplying active products</p>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
                        🚚
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Deliveries This Week</p>
                        <p className={styles.metricValue}>{loading ? "…" : stats.deliveriesThisWeek}</p>
                        <p className={styles.metricDesc}>Suppliers who delivered in the last 7 days</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Supplier Directory</h2>
                    <input
                        type="search"
                        placeholder="Search suppliers by name or email..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)' }}>Loading suppliers...</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Supplier Name</th>
                                    <th>Categories</th>
                                    <th>Reliability Score</th>
                                    <th>Last Delivery</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
                                                {suppliers.length === 0
                                                    ? 'No suppliers yet. Click "Add Supplier" to get started.'
                                                    : 'No suppliers found matching your search.'}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSuppliers.map((supplier) => {
                                    const relScore = supplier.reliability;
                                    const getRelColor = (): string => {
                                        if (relScore >= 90) return 'var(--success)';
                                        if (relScore >= 80) return 'var(--warning)';
                                        return 'var(--danger)';
                                    };
                                    const relColor = getRelColor();
                                    return (
                                        <tr key={supplier._id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.supplierInfo}>
                                                    <div className={styles.supplierAvatar}>{supplier.name.charAt(0)}</div>
                                                    <div>
                                                        <p className={styles.supplierName}>{supplier.name}</p>
                                                        <p className={styles.supplierContact}>{supplier.contact} {supplier.phone ? `• ${supplier.phone}` : ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {supplier.categories.length > 0
                                                        ? supplier.categories.map(cat => (
                                                            <span key={cat} style={{ background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                                                                {cat}
                                                            </span>
                                                        ))
                                                        : <span style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>—</span>
                                                    }
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: supplier.reliability === 0 ? 'var(--ink-muted)' : relColor }}>
                                                {supplier.reliability === 0 ? 'N/A' : `${supplier.reliability}%`}
                                            </td>
                                            <td style={{ color: 'var(--ink-muted)' }}>
                                                {supplier.lastDelivery
                                                    ? new Date(supplier.lastDelivery).toLocaleDateString()
                                                    : 'No deliveries yet'}
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${
                                                    (() => {
                                                        if (supplier.status === 'Active') return styles.badgeActive;
                                                        if (supplier.status === 'Inactive') return styles.badgeInactive;
                                                        return styles.badgeWarning;
                                                    })()
                                                }`}>
                                                    {supplier.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className={styles.actionBtn} title="Edit Supplier" onClick={() => openEditModal(supplier)}>✏️</button>
                                                <button className={styles.actionBtn} title="Delete Supplier" onClick={() => handleDeleteSupplier(supplier._id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Supplier Modal */}
            {showModal && (
                <dialog className={styles.overlay} open onCancel={() => setShowModal(false)}>
                    <section className={styles.modal} aria-label="Add supplier form">
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Add New Supplier</h3>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddSupplier} style={{ display: 'contents' }}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="supplierName">Supplier Name *</label>
                                    <input id="supplierName" className={styles.formInput} type="text" required placeholder="e.g. Fresh Farms Inc"
                                        value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="supplierEmail">Email Address *</label>
                                    <input id="supplierEmail" className={styles.formInput} type="email" required placeholder="e.g. contact@freshfarms.com"
                                        value={newSupplier.contact} onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="supplierPhone">Phone Number</label>
                                    <input id="supplierPhone" className={styles.formInput} type="tel" placeholder="e.g. +1 (555) 000-0000"
                                        value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="supplierCategories">Categories Supplied (comma separated)</label>
                                    <input id="supplierCategories" className={styles.formInput} type="text" placeholder="e.g. Fruits, Vegetables, Dairy"
                                        value={newSupplier.categories} onChange={e => setNewSupplier({ ...newSupplier, categories: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="supplierNotes">Notes</label>
                                    <input id="supplierNotes" className={styles.formInput} type="text" placeholder="Optional notes..."
                                        value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? "Saving..." : "Save Supplier"}
                                </button>
                            </div>
                        </form>
                    </section>
                </dialog>
            )}

            {/* Edit Supplier Modal */}
            {showEditModal && editSupplier && (
                <dialog className={styles.overlay} open onCancel={() => setShowEditModal(false)}>
                    <section className={styles.modal} aria-label="Edit supplier form">
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Edit Supplier</h3>
                            <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateSupplier} style={{ display: 'contents' }}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editSupplierName">Supplier Name *</label>
                                    <input id="editSupplierName" className={styles.formInput} type="text" required value={editSupplier.name}
                                        onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editSupplierEmail">Email Address *</label>
                                    <input id="editSupplierEmail" className={styles.formInput} type="email" required value={editSupplier.contact}
                                        onChange={e => setEditSupplier({ ...editSupplier, contact: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editSupplierPhone">Phone Number</label>
                                    <input id="editSupplierPhone" className={styles.formInput} type="tel" value={editSupplier.phone}
                                        onChange={e => setEditSupplier({ ...editSupplier, phone: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editSupplierCategories">Categories (comma separated)</label>
                                    <input id="editSupplierCategories" className={styles.formInput} type="text" value={editSupplier.categories}
                                        onChange={e => setEditSupplier({ ...editSupplier, categories: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editReliability">Reliability Score (0–100)</label>
                                    <input id="editReliability" className={styles.formInput} type="number" min={0} max={100} value={editSupplier.reliability}
                                        onChange={e => setEditSupplier({ ...editSupplier, reliability: Number(e.target.value) })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editLastDelivery">Last Delivery Date</label>
                                    <input id="editLastDelivery" className={styles.formInput} type="date" value={editSupplier.lastDelivery || ""}
                                        onChange={e => setEditSupplier({ ...editSupplier, lastDelivery: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editStatus">Status</label>
                                    <select id="editStatus" className={styles.formSelect} value={editSupplier.status}
                                        onChange={e => setEditSupplier({ ...editSupplier, status: e.target.value as "Active" | "Inactive" | "Under Review" })}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Under Review">Under Review</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="editNotes">Notes</label>
                                    <input id="editNotes" className={styles.formInput} type="text" value={editSupplier.notes || ""}
                                        onChange={e => setEditSupplier({ ...editSupplier, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </section>
                </dialog>
            )}
        </div>
    );
}
