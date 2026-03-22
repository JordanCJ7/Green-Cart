"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi, Category } from "@/lib/inventory-api";
import styles from "../../admin.module.css";
import pageStyles from "./new-product.module.css";

export default function NewProductPage() {
    const token = getAccessToken();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoryLoading, setCategoryLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        price: "",
        compareAtPrice: "",
        stock: "",
        lowStockThreshold: "10",
        unit: "",
        category: "",
        isActive: true,
    });

    useEffect(() => {
        inventoryApi.getCategories().then(res => {
            if (res.categories) setCategories(res.categories);
        }).catch(err => console.error("Could not load categories", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            await inventoryApi.createItem(token, {
                ...formData,
                price: Number.parseFloat(formData.price) || 0,
                compareAtPrice: formData.compareAtPrice ? Number.parseFloat(formData.compareAtPrice) : undefined,
                stock: Number.parseInt(formData.stock) || 0,
                lowStockThreshold: Number.parseInt(formData.lowStockThreshold) || 10,
            });
            router.push("/admin/products");
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create product";
            setError(message);
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className={styles.title}>Add New Product</h1>
                    <p className={styles.subtitle}>Create a new item in your catalog.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem', maxWidth: '900px' }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className={pageStyles.formWrapper}>
                <form onSubmit={handleSubmit}>
                    
                    {/* General Info */}
                    <div className={pageStyles.sectionGroup}>
                        <div className={pageStyles.sectionHeader}>
                            <div className={pageStyles.sectionIcon}>🏷️</div>
                            <div>
                                <h2 className={pageStyles.sectionTitle}>Basic Information</h2>
                                <p className={pageStyles.sectionDesc}>Product details and categorization.</p>
                            </div>
                        </div>

                        <div className={pageStyles.grid2}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="name">Product Name <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input required id="name" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="e.g. Organic Avocados" autoComplete="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="sku">SKU / Barcode <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input required id="sku" name="sku" value={formData.sku} onChange={handleChange} className="form-input" placeholder="e.g. GC-AVD-001" autoComplete="off" />
                            </div>
                        </div>

                        <div className={pageStyles.grid2}>
                            <div className="form-group">
                                <div className={pageStyles.categoryHeader}>
                                    <label className="form-label" htmlFor="category" style={{ marginBottom: 0 }}>Category</label>
                                    {!isAddingCategory && (
                                        <button type="button" className={pageStyles.addCategoryBtn} onClick={() => setIsAddingCategory(true)}>
                                            ➕ New Category
                                        </button>
                                    )}
                                </div>
                                
                                {isAddingCategory ? (
                                    <div className={pageStyles.inlineCategoryForm}>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="New Category Name" 
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            autoFocus
                                            style={{ flex: 1 }}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            disabled={categoryLoading || !newCategoryName.trim()}
                                            onClick={async () => {
                                                if (!token || !newCategoryName.trim()) return;
                                                setCategoryLoading(true);
                                                try {
                                                    const cleanName = newCategoryName.trim();
                                                    // Generate a valid slug: lowercase, alphanumeric, hyphens only
                                                    const slug = cleanName.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
                                                    
                                                    const res = await inventoryApi.createCategory(token, { name: cleanName, slug });
                                                    if (res.category) {
                                                        setCategories(prev => [...prev, res.category]);
                                                        setFormData(prev => ({ ...prev, category: res.category._id }));
                                                        setIsAddingCategory(false);
                                                        setNewCategoryName("");
                                                        setError(null);
                                                    }
                                                } catch (err: unknown) {
                                                    const message = err instanceof Error ? err.message : "Failed to create category";
                                                    setError(message);
                                                } finally {
                                                    setCategoryLoading(false);
                                                }
                                            }}
                                        >
                                            {categoryLoading ? "..." : "Save"}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            onClick={() => setIsAddingCategory(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <select required id="category" name="category" value={formData.category} onChange={handleChange} className="form-input">
                                        <option value="">Select a Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            
                            <label className={pageStyles.checkboxGroup} htmlFor="activeCheck" aria-label="Active Product - Visible to customers on the storefront">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="activeCheck" />
                                <div className={pageStyles.checkboxLabel}>
                                    <span className={pageStyles.checkboxTitle}>Active Product</span>
                                    <span className={pageStyles.checkboxDesc}>Visible to customers on the storefront</span>
                                </div>
                            </label>
                        </div>

                        <div className={pageStyles.singleCol} style={{ marginBottom: 0 }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="description">Full Description</label>
                                <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="form-input" rows={4} placeholder="Describe the product, its benefits, origins, etc..." />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Details */}
                    <div className={pageStyles.sectionGroup}>
                        <div className={pageStyles.sectionHeader}>
                            <div className={pageStyles.sectionIcon}>💲</div>
                            <div>
                                <h2 className={pageStyles.sectionTitle}>Pricing</h2>
                                <p className={pageStyles.sectionDesc}>Set the base price and optional discount comparisons.</p>
                            </div>
                        </div>

                        <div className={pageStyles.grid2} style={{ marginBottom: 0 }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="price">Price ($) <span style={{color: 'var(--danger)'}}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', fontWeight: 500 }}>$</span>
                                    <input required id="price" type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="form-input" style={{ paddingLeft: '32px' }} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="compareAtPrice">Compare at Price ($)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', fontWeight: 500 }}>$</span>
                                    <input id="compareAtPrice" type="number" step="0.01" name="compareAtPrice" value={formData.compareAtPrice} onChange={handleChange} className="form-input" style={{ paddingLeft: '32px' }} placeholder="0.00 (Optional crossed-out price)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className={pageStyles.sectionGroup}>
                        <div className={pageStyles.sectionHeader}>
                            <div className={pageStyles.sectionIcon}>📦</div>
                            <div>
                                <h2 className={pageStyles.sectionTitle}>Inventory Tracking</h2>
                                <p className={pageStyles.sectionDesc}>Manage stock levels and low stock alerts.</p>
                            </div>
                        </div>

                        <div className={pageStyles.grid3} style={{ marginBottom: 0 }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="stock">Available Stock <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input required id="stock" type="number" name="stock" value={formData.stock} onChange={handleChange} className="form-input" placeholder="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="lowStockThreshold">Low Stock Threshold</label>
                                <input required id="lowStockThreshold" type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="form-input" placeholder="10" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="unit">Unit of Measure <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input required id="unit" name="unit" value={formData.unit} onChange={handleChange} className="form-input" placeholder="e.g. kg, pack, box" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={pageStyles.formFooter}>
                        <button type="button" onClick={() => router.back()} className="btn btn-secondary btn-lg">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
                            {loading ? "Saving..." : "✨ Create Product"}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
}
