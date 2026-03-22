import React from "react";
import { AlertTriangle, Banknote, Boxes, ImagePlus, Tag } from "lucide-react";
import pageStyles from "../new/new-product.module.css";

export interface ProductFormData {
    name: string;
    description: string;
    category: string;
    sku: string;
    price: string;
    compareAtPrice: string;
    stock: string;
    lowStockThreshold: string;
    unit: string;
    imagesInput: string;
    isActive: boolean;
}

interface ProductFormProps {
    mode: "create" | "edit";
    formData: ProductFormData;
    loading: boolean;
    saving: boolean;
    error: string | null;
    categories: string[];
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onCancel: () => void;
    skuDisabled?: boolean;
    stockDisabled?: boolean;
}

function getCreatePlaceholder(isCreateMode: boolean, text: string): string | undefined {
    return isCreateMode ? text : undefined;
}

function getSubmitButtonLabel(mode: "create" | "edit", saving: boolean): string {
    if (mode === "create") {
        return saving ? "Saving..." : "Create Product";
    }
    return saving ? "Saving Changes..." : "Update Product";
}

export const ProductForm: React.FC<ProductFormProps> = ({
    mode,
    formData,
    loading,
    saving,
    error,
    categories,
    onFormChange,
    onSubmit,
    onCancel,
    skuDisabled = false,
    stockDisabled = false,
}) => {
    const isCreateMode = mode === "create";
    const submitButtonLabel = getSubmitButtonLabel(mode, saving);
    const parsedImages = formData.imagesInput
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

    if (loading) {
        return <div className={pageStyles.loadingState}>Loading product details...</div>;
    }

    return (
        <>
            {error && (
                <div className={`alert alert-error ${pageStyles.formErrorAlert}`}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            <div className={pageStyles.formWrapper}>
                <form onSubmit={onSubmit}>
                    {/* General Info */}
                    <div className={pageStyles.sectionGroup}>
                        <div className={pageStyles.sectionHeader}>
                            <div className={pageStyles.sectionIcon}><Tag size={18} /></div>
                            <div>
                                <h2 className={pageStyles.sectionTitle}>Basic Information</h2>
                                <p className={pageStyles.sectionDesc}>Product details and categorization.</p>
                            </div>
                        </div>

                        <div className={pageStyles.grid2}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="name">Product Name <span className={pageStyles.requiredMark}>*</span></label>
                                <input 
                                    required 
                                    id="name" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={onFormChange} 
                                    className="form-input" 
                                    placeholder={getCreatePlaceholder(isCreateMode, "e.g. Organic Avocados")}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="category">Category <span className={pageStyles.requiredMark}>*</span></label>
                                <select
                                    required
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={onFormChange}
                                    className="form-input"
                                >
                                    <option value="">-- Select a Category --</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="sku">SKU / Barcode <span className={pageStyles.requiredMark}>*</span></label>
                                <input 
                                    required 
                                    id="sku" 
                                    name="sku" 
                                    value={formData.sku} 
                                    onChange={onFormChange} 
                                    placeholder={getCreatePlaceholder(isCreateMode, "e.g. GC-AVD-001")}
                                    disabled={skuDisabled}
                                    className={`form-input ${skuDisabled ? pageStyles.disabledInput : ""}`}
                                    title={skuDisabled ? "SKU cannot be changed" : undefined}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className={pageStyles.singleCol}>
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

                        <div className={`${pageStyles.singleCol} ${pageStyles.noBottomSpace}`}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="description">Full Description</label>
                                <textarea 
                                    id="description" 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={onFormChange} 
                                    className="form-input" 
                                    rows={4}
                                    placeholder={getCreatePlaceholder(isCreateMode, "Describe the product, its benefits, origins, etc...")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={pageStyles.sectionGroup}>
                        <div className={pageStyles.sectionHeader}>
                            <div className={pageStyles.sectionIcon}><ImagePlus size={18} /></div>
                            <div>
                                <h2 className={pageStyles.sectionTitle}>Product Images</h2>
                                <p className={pageStyles.sectionDesc}>Add image URLs separated by commas or new lines.</p>
                            </div>
                        </div>

                        <div className={pageStyles.singleCol}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="imagesInput">Image URLs</label>
                                <textarea
                                    id="imagesInput"
                                    name="imagesInput"
                                    value={formData.imagesInput}
                                    onChange={onFormChange}
                                    className="form-input"
                                    rows={4}
                                    placeholder={getCreatePlaceholder(isCreateMode, "https://.../image-1.jpg\nhttps://.../image-2.jpg")}
                                />
                                <small className={pageStyles.fieldHint}>Up to 8 images are supported.</small>
                            </div>
                        </div>

                        {parsedImages.length > 0 && (
                            <div className={`${pageStyles.singleCol} ${pageStyles.noBottomSpace}`}>
                                <div className={pageStyles.imageChipList}>
                                    {parsedImages.map((image, index) => (
                                        <span key={`${image}-${index}`} className={pageStyles.imageChip} title={image}>
                                            Image {index + 1}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Details */}
                    <div className={pageStyles.sectionGroup}>
                        <div className={pageStyles.sectionHeader}>
                            <div className={pageStyles.sectionIcon}><Banknote size={18} /></div>
                            <div>
                                <h2 className={pageStyles.sectionTitle}>Pricing</h2>
                                <p className={pageStyles.sectionDesc}>Set the base price and optional discount comparisons.</p>
                            </div>
                        </div>

                        <div className={`${pageStyles.grid2} ${pageStyles.noBottomSpace}`}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="price">Price ($) <span className={pageStyles.requiredMark}>*</span></label>
                                <div className={pageStyles.inputPrefixWrap}>
                                    <span className={pageStyles.inputPrefix}>$</span>
                                    <input 
                                        required 
                                        id="price" 
                                        type="number" 
                                        step="0.01" 
                                        name="price" 
                                        value={formData.price} 
                                        onChange={onFormChange} 
                                        className={`form-input ${pageStyles.withPrefixInput}`}
                                        placeholder={getCreatePlaceholder(isCreateMode, "0.00")}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="compareAtPrice">Compare at Price ($)</label>
                                <div className={pageStyles.inputPrefixWrap}>
                                    <span className={pageStyles.inputPrefix}>$</span>
                                    <input 
                                        id="compareAtPrice" 
                                        type="number" 
                                        step="0.01" 
                                        name="compareAtPrice" 
                                        value={formData.compareAtPrice} 
                                        onChange={onFormChange} 
                                        className={`form-input ${pageStyles.withPrefixInput}`}
                                        placeholder={getCreatePlaceholder(isCreateMode, "0.00 (Optional crossed-out price)")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className={pageStyles.sectionGroup}>
                        <div className={pageStyles.sectionHeader}>
                            <div className={pageStyles.sectionIcon}><Boxes size={18} /></div>
                            <div>
                                <h2 className={pageStyles.sectionTitle}>Inventory Tracking</h2>
                                <p className={pageStyles.sectionDesc}>Manage stock levels and low stock alerts.</p>
                            </div>
                        </div>

                        <div className={`${pageStyles.grid3} ${pageStyles.noBottomSpace}`}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="stock">
                                    Available Stock
                                    {isCreateMode && <span className={pageStyles.requiredMark}>*</span>}
                                </label>
                                <input 
                                    id="stock" 
                                    type="number" 
                                    name="stock" 
                                    value={formData.stock} 
                                    onChange={onFormChange} 
                                    disabled={stockDisabled}
                                    className={`form-input ${stockDisabled ? pageStyles.disabledInput : ""}`}
                                    title={stockDisabled ? "Use the stock adjustment tool to change inventory levels" : undefined}
                                    placeholder={getCreatePlaceholder(isCreateMode, "0")}
                                    required={isCreateMode}
                                />
                                {stockDisabled && (
                                    <small className={pageStyles.fieldHint}>Cannot edit stock directly here.</small>
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
                                    placeholder={getCreatePlaceholder(isCreateMode, "10")}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="unit">Unit of Measure <span className={pageStyles.requiredMark}>*</span></label>
                                <input 
                                    required 
                                    id="unit" 
                                    name="unit" 
                                    value={formData.unit} 
                                    onChange={onFormChange} 
                                    className="form-input"
                                    placeholder={getCreatePlaceholder(isCreateMode, "e.g. kg, pack, box")}
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
                            {submitButtonLabel}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};
