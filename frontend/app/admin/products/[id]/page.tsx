"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi, Category } from "@/lib/inventory-api";
import styles from "../../admin.module.css";
import pageStyles from "../new/new-product.module.css";

export default function EditProductPage() {
    const token = getAccessToken();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const res = await inventoryApi.getItemById(id);
                const item = res.item;
                setFormData({
                    name: item.name || "",
                    description: item.description || "",
                    sku: item.sku || "",
                    price: item.price?.toString() || "",
                    compareAtPrice: item.compareAtPrice?.toString() || "",
                    stock: item.stock?.toString() || "",
                    lowStockThreshold: item.lowStockThreshold?.toString() || "10",
                    unit: item.unit || "",
                    category: typeof item.category === "object" ? item.category?._id : item.category || "",
                    isActive: item.isActive !== false,
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load product";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadProduct();
        }
    }, [id]);

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

        setSaving(true);
        setError(null);

        try {
            await inventoryApi.updateItem(token, id, {
                ...formData,
                price: parseFloat(formData.price) || 0,
                compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
                stock: parseInt(formData.stock) || 0,
                lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
            });
            router.push("/admin/products");
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update product";
            setError(message);
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.page}>Loading product details...</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Edit Product: {formData.name}</h1>
                    <p className={styles.subtitle}>Update the details of your inventory item.</p>
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
                                <label className="form-label">Product Name <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input required name="name" value={formData.name} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">SKU / Barcode <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input required name="sku" value={formData.sku} onChange={handleChange} className="form-input" disabled style={{ background: 'var(--surface-2)', cursor: 'not-allowed' }} title="SKU cannot be changed" />
                            </div>
                        </div>

                        <div className={pageStyles.grid2}>
                            <div className="form-group">
                                <div className={pageStyles.categoryHeader}>
                                    <label className="form-label" style={{ marginBottom: 0 }}>Category</label>
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
                                                    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                    
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
                                    <select required name="category" value={formData.category} onChange={handleChange} className="form-input">
                                        <option value="">Select a Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            
                            <label className={pageStyles.checkboxGroup} htmlFor="activeCheck">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="activeCheck" />
                                <div className={pageStyles.checkboxLabel}>
                                    <span className={pageStyles.checkboxTitle}>Active Product</span>
                                    <span className={pageStyles.checkboxDesc}>Visible to customers on the storefront</span>
                                </div>
                            </label>
                        </div>

                        <div className={pageStyles.singleCol} style={{ marginBottom: 0 }}>
                            <div className="form-group">
                                <label className="form-label">Full Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows={4} />
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
                                <label className="form-label">Price ($) <span style={{color: 'var(--danger)'}}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', fontWeight: 500 }}>$</span>
                                    <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="form-input" style={{ paddingLeft: '32px' }} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Compare at Price ($)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', fontWeight: 500 }}>$</span>
                                    <input type="number" step="0.01" name="compareAtPrice" value={formData.compareAtPrice} onChange={handleChange} className="form-input" style={{ paddingLeft: '32px' }} />
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
                                <label className="form-label">Available Stock</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="form-input" disabled style={{ background: 'var(--surface-2)', cursor: 'not-allowed' }} title="Use the stock adjustment tool to change inventory levels" />
                                <small style={{ color: 'var(--ink-muted)', display: 'block', marginTop: '6px', fontSize: '0.75rem' }}>Cannot edit stock directly here.</small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Low Stock Threshold</label>
                                <input required type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit of Measure <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input required name="unit" value={formData.unit} onChange={handleChange} className="form-input" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={pageStyles.formFooter}>
                        <button type="button" onClick={() => router.back()} className="btn btn-secondary btn-lg">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
                            {saving ? "Saving Changes..." : "♻️ Update Product"}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
}
