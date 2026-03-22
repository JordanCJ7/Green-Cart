import React from "react";
import { Category } from "@/lib/inventory-api";
import pageStyles from "../new/new-product.module.css";

export interface ProductFormData {
    name: string;
    description: string;
    sku: string;
    price: string;
    compareAtPrice: string;
    stock: string;
    lowStockThreshold: string;
    unit: string;
    category: string;
    isActive: boolean;
}

interface ProductFormProps {
    mode: "create" | "edit";
    formData: ProductFormData;
    categories: Category[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    isAddingCategory: boolean;
    newCategoryName: string;
    categoryLoading: boolean;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onCancel: () => void;
    onAddCategoryToggle: (show: boolean) => void;
    onNewCategoryNameChange: (value: string) => void;
    onAddCategory: () => Promise<void>;
    skuDisabled?: boolean;
    stockDisabled?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
    mode,
    formData,
    categories,
    loading,
    saving,
    error,
    isAddingCategory,
    newCategoryName,
    categoryLoading,
    onFormChange,
    onSubmit,
    onCancel,
    onAddCategoryToggle,
    onNewCategoryNameChange,
    onAddCategory,
    skuDisabled = false,
    stockDisabled = false,
}) => {
    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-muted)' }}>Loading product details...</div>;
    }

    return (
        <>
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem', maxWidth: '900px' }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className={pageStyles.formWrapper}>
                <form onSubmit={onSubmit}>
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
                                <input 
                                    required 
                                    id="name" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={onFormChange} 
                                    className="form-input" 
                                    placeholder={mode === "create" ? "e.g. Organic Avocados" : undefined}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="sku">SKU / Barcode <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input 
                                    required 
                                    id="sku" 
                                    name="sku" 
                                    value={formData.sku} 
                                    onChange={onFormChange} 
                                    className="form-input" 
                                    placeholder={mode === "create" ? "e.g. GC-AVD-001" : undefined}
                                    disabled={skuDisabled}
                                    style={skuDisabled ? { background: 'var(--surface-2)', cursor: 'not-allowed' } : undefined}
                                    title={skuDisabled ? "SKU cannot be changed" : undefined}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className={pageStyles.grid2}>
                            <div className="form-group">
                                <div className={pageStyles.categoryHeader}>
                                    <label className="form-label" htmlFor="category" style={{ marginBottom: 0 }}>Category</label>
                                    {!isAddingCategory && (
                                        <button 
                                            type="button" 
                                            className={pageStyles.addCategoryBtn} 
                                            onClick={() => onAddCategoryToggle(true)}
                                        >
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
                                            onChange={(e) => onNewCategoryNameChange(e.target.value)}
                                            autoFocus
                                            style={{ flex: 1 }}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            disabled={categoryLoading || !newCategoryName.trim()}
                                            onClick={onAddCategory}
                                        >
                                            {categoryLoading ? "..." : "Save"}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            onClick={() => onAddCategoryToggle(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <select 
                                        required 
                                        id="category" 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={onFormChange} 
                                        className="form-input"
                                    >
                                        <option value="">Select a Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            
                            <label className={pageStyles.checkboxGroup} htmlFor="activeCheck" aria-label="Active Product - Visible to customers on the storefront">
                                <input 
                                    type="checkbox" 
                                    name="isActive" 
                                    checked={formData.isActive} 
                                    onChange={onFormChange} 
                                    id="activeCheck" 
                                />
                                <div className={pageStyles.checkboxLabel}>
                                    <span className={pageStyles.checkboxTitle}>Active Product</span>
                                    <span className={pageStyles.checkboxDesc}>Visible to customers on the storefront</span>
                                </div>
                            </label>
                        </div>

                        <div className={pageStyles.singleCol} style={{ marginBottom: 0 }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="description">Full Description</label>
                                <textarea 
                                    id="description" 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={onFormChange} 
                                    className="form-input" 
                                    rows={4}
                                    placeholder={mode === "create" ? "Describe the product, its benefits, origins, etc..." : undefined}
                                />
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
                                    <input 
                                        required 
                                        id="price" 
                                        type="number" 
                                        step="0.01" 
                                        name="price" 
                                        value={formData.price} 
                                        onChange={onFormChange} 
                                        className="form-input" 
                                        style={{ paddingLeft: '32px' }}
                                        placeholder={mode === "create" ? "0.00" : undefined}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="compareAtPrice">Compare at Price ($)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', fontWeight: 500 }}>$</span>
                                    <input 
                                        id="compareAtPrice" 
                                        type="number" 
                                        step="0.01" 
                                        name="compareAtPrice" 
                                        value={formData.compareAtPrice} 
                                        onChange={onFormChange} 
                                        className="form-input" 
                                        style={{ paddingLeft: '32px' }}
                                        placeholder={mode === "create" ? "0.00 (Optional crossed-out price)" : undefined}
                                    />
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
                                <label className="form-label" htmlFor="stock">
                                    Available Stock
                                    {mode === "create" && <span style={{color: 'var(--danger)'}}>*</span>}
                                </label>
                                <input 
                                    id="stock" 
                                    type="number" 
                                    name="stock" 
                                    value={formData.stock} 
                                    onChange={onFormChange} 
                                    className="form-input"
                                    disabled={stockDisabled}
                                    style={stockDisabled ? { background: 'var(--surface-2)', cursor: 'not-allowed' } : undefined}
                                    title={stockDisabled ? "Use the stock adjustment tool to change inventory levels" : undefined}
                                    placeholder={mode === "create" ? "0" : undefined}
                                    required={mode === "create"}
                                />
                                {stockDisabled && (
                                    <small style={{ color: 'var(--ink-muted)', display: 'block', marginTop: '6px', fontSize: '0.75rem' }}>Cannot edit stock directly here.</small>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="lowStockThreshold">Low Stock Threshold</label>
                                <input 
                                    required 
                                    id="lowStockThreshold" 
                                    type="number" 
                                    name="lowStockThreshold" 
                                    value={formData.lowStockThreshold} 
                                    onChange={onFormChange} 
                                    className="form-input"
                                    placeholder={mode === "create" ? "10" : undefined}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="unit">Unit of Measure <span style={{color: 'var(--danger)'}}>*</span></label>
                                <input 
                                    required 
                                    id="unit" 
                                    name="unit" 
                                    value={formData.unit} 
                                    onChange={onFormChange} 
                                    className="form-input"
                                    placeholder={mode === "create" ? "e.g. kg, pack, box" : undefined}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={pageStyles.formFooter}>
                        <button type="button" onClick={onCancel} className="btn btn-secondary btn-lg">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
                            {mode === "create" 
                                ? (saving ? "Saving..." : "✨ Create Product")
                                : (saving ? "Saving Changes..." : "♻️ Update Product")
                            }
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};
