"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi } from "@/lib/inventory-api";
import { ProductForm, ProductFormData } from "../_components/ProductForm";
import { useCategories } from "../_hooks/useCategories";
import styles from "../../admin.module.css";

export default function NewProductPage() {
    const token = getAccessToken();
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [formData, setFormData] = useState<ProductFormData>({
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

    const categoryHook = useCategories();

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
        setFormError(null);

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
            setFormError(message);
            setSaving(false);
        }
    };

    const handleAddCategory = async () => {
        const newCategory = await categoryHook.handleAddCategory();
        if (newCategory) {
            setFormData(prev => ({ ...prev, category: newCategory._id }));
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

            <ProductForm
                mode="create"
                formData={formData}
                categories={categoryHook.categories}
                loading={false}
                saving={saving}
                error={formError || categoryHook.error}
                isAddingCategory={categoryHook.isAddingCategory}
                newCategoryName={categoryHook.newCategoryName}
                categoryLoading={categoryHook.categoryLoading}
                onFormChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                onAddCategoryToggle={categoryHook.setIsAddingCategory}
                onNewCategoryNameChange={categoryHook.setNewCategoryName}
                onAddCategory={handleAddCategory}
            />
        </div>
    );
}
