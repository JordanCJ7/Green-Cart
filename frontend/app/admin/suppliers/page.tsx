"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./suppliers.module.css";
import globalStyles from "../../admin.module.css";

// Mock Data for Suppliers since there is no backend for this yet
const MOCK_SUPPLIERS_INITIAL = [
    {
        id: "sup_1",
        name: "EcoFarm Distributors",
        contact: "contact@ecofarm.com",
        phone: "+1 (555) 123-4567",
        status: "Active",
        reliability: "98%",
        lastDelivery: "2026-03-20",
        categories: ["Vegetables", "Fruits"],
    },
    {
        id: "sup_2",
        name: "Green Valley Organics",
        contact: "orders@greenvalley.org",
        phone: "+1 (555) 987-6543",
        status: "Active",
        reliability: "95%",
        lastDelivery: "2026-03-18",
        categories: ["Dairy", "Eggs"],
    },
    {
        id: "sup_3",
        name: "Sunset Harvests",
        contact: "hello@sunsetharvest.net",
        phone: "+1 (555) 456-7890",
        status: "Under Review",
        reliability: "82%",
        lastDelivery: "2026-03-05",
        categories: ["Bakery", "Grains"],
    },
    {
        id: "sup_4",
        name: "Nature's Best Meats",
        contact: "info@naturesbest.com",
        phone: "+1 (555) 234-5678",
        status: "Inactive",
        reliability: "70%",
        lastDelivery: "2025-11-12",
        categories: ["Meat", "Poultry"],
    },
];

export default function SuppliersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS_INITIAL);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: "",
        contact: "",
        phone: "",
        categories: ""
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editSupplier, setEditSupplier] = useState<any>(null);

    const handleDeleteSupplier = (id: string) => {
        if (confirm("Are you sure you want to delete this supplier?")) {
            setSuppliers(suppliers.filter(s => s.id !== id));
        }
    };

    const handleUpdateSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editSupplier.name || !editSupplier.contact) return;

        const catArray = typeof editSupplier.categories === 'string' 
            ? editSupplier.categories.split(",").map((s: string) => s.trim()).filter(Boolean)
            : editSupplier.categories;

        const updated = {
            ...editSupplier,
            categories: catArray.length > 0 ? catArray : ["General"]
        };

        setSuppliers(suppliers.map(s => s.id === updated.id ? updated : s));
        setShowEditModal(false);
        setEditSupplier(null);
    };

    const openEditModal = (supplier: any) => {
        setEditSupplier({
            ...supplier,
            categories: supplier.categories.join(", ")
        });
        setShowEditModal(true);
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = suppliers.filter(s => s.status === 'Active').length;

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSupplier.name || !newSupplier.contact) return;

        const catArray = newSupplier.categories
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        const newSup = {
            id: `sup_${Date.now()}`,
            name: newSupplier.name,
            contact: newSupplier.contact,
            phone: newSupplier.phone || "N/A",
            status: "Under Review",
            reliability: "N/A",
            lastDelivery: new Date().toISOString().split('T')[0],
            categories: catArray.length > 0 ? catArray : ["General"],
        };

        setSuppliers([newSup, ...suppliers]);
        setShowModal(false);
        setNewSupplier({ name: "", contact: "", phone: "", categories: "" });
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

            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
                        🏢
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Total Suppliers</p>
                        <p className={styles.metricValue}>{suppliers.length}</p>
                        <p className={styles.metricDesc}>Registered in system</p>
                    </div>
                </div>
                
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                        ✅
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Active Vendors</p>
                        <p className={styles.metricValue}>{activeCount}</p>
                        <p className={styles.metricDesc}>Currently supplying active products</p>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
                        🚚
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Deliveries This Week</p>
                        <p className={styles.metricValue}>12</p>
                        <p className={styles.metricDesc}>Expected incoming loads</p>
                    </div>
                </div>
            </div>

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
                            {filteredSuppliers.map((supplier) => {
                                const initial = supplier.name.charAt(0);
                                return (
                                    <tr key={supplier.id} className={styles.tableRow}>
                                        <td>
                                            <div className={styles.supplierInfo}>
                                                <div className={styles.supplierAvatar}>{initial}</div>
                                                <div>
                                                    <p className={styles.supplierName}>{supplier.name}</p>
                                                    <p className={styles.supplierContact}>{supplier.contact} • {supplier.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {supplier.categories.map(cat => (
                                                    <span key={cat} style={{ background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: supplier.reliability === "N/A" ? 'var(--ink-muted)' : parseInt(supplier.reliability) > 90 ? 'var(--success)' : parseInt(supplier.reliability) > 80 ? 'var(--warning)' : 'var(--danger)' }}>
                                            {supplier.reliability}
                                        </td>
                                        <td style={{ color: 'var(--ink-muted)' }}>
                                            {supplier.lastDelivery ? new Date(supplier.lastDelivery).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${
                                                supplier.status === 'Active' ? styles.badgeActive : 
                                                supplier.status === 'Inactive' ? styles.badgeInactive : styles.badgeWarning
                                            }`}>
                                                {supplier.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button 
                                                className={styles.actionBtn} 
                                                title="Edit Supplier"
                                                onClick={() => openEditModal(supplier)}
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                className={styles.actionBtn} 
                                                title="Delete Supplier"
                                                onClick={() => handleDeleteSupplier(supplier.id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredSuppliers.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
                            No suppliers found matching your search.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Supplier Modal */}
            {showModal && (
                <div className={styles.overlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Add New Supplier</h3>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        
                        <form onSubmit={handleAddSupplier}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Supplier Name *</label>
                                <input 
                                    className={styles.formInput}
                                    type="text" 
                                    required 
                                    placeholder="e.g. Fresh Farms Inc" 
                                    value={newSupplier.name}
                                    onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email Address *</label>
                                <input 
                                    className={styles.formInput}
                                    type="email" 
                                    required 
                                    placeholder="e.g. contact@freshfarms.com" 
                                    value={newSupplier.contact}
                                    onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Phone Number</label>
                                <input 
                                    className={styles.formInput}
                                    type="tel" 
                                    placeholder="e.g. +1 (555) 000-0000" 
                                    value={newSupplier.phone}
                                    onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Categories Supplied (comma separated)</label>
                                <input 
                                    className={styles.formInput}
                                    type="text" 
                                    placeholder="e.g. Fruits, Vegetables, Dairy" 
                                    value={newSupplier.categories}
                                    onChange={e => setNewSupplier({...newSupplier, categories: e.target.value})}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Supplier Modal */}
            {showEditModal && editSupplier && (
                <div className={styles.overlay} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Edit Supplier</h3>
                            <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        
                        <form onSubmit={handleUpdateSupplier}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Supplier Name *</label>
                                <input 
                                    className={styles.formInput}
                                    type="text" 
                                    required 
                                    value={editSupplier.name}
                                    onChange={e => setEditSupplier({...editSupplier, name: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email Address *</label>
                                <input 
                                    className={styles.formInput}
                                    type="email" 
                                    required 
                                    value={editSupplier.contact}
                                    onChange={e => setEditSupplier({...editSupplier, contact: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Phone Number</label>
                                <input 
                                    className={styles.formInput}
                                    type="tel" 
                                    value={editSupplier.phone}
                                    onChange={e => setEditSupplier({...editSupplier, phone: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Categories Supplied (comma separated)</label>
                                <input 
                                    className={styles.formInput}
                                    type="text" 
                                    value={editSupplier.categories}
                                    onChange={e => setEditSupplier({...editSupplier, categories: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Status</label>
                                <select 
                                    className={styles.formSelect}
                                    value={editSupplier.status}
                                    onChange={e => setEditSupplier({...editSupplier, status: e.target.value})}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Under Review">Under Review</option>
                                </select>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
