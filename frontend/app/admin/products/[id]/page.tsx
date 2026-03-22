"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi } from "@/lib/inventory-api";
import { ProductForm } from "../_components/ProductForm";
import { useProductForm } from "../_hooks/useProductForm";
import { useInventoryCategories } from "../_hooks/useInventoryCategories";
import styles from "../products-page.module.css";

export default function EditProductPage() {
    const token = getAccessToken();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { formData, handleChange, loadProductData, serializeFormData } = useProductForm();
    const { categories, fetchCategories } = useInventoryCategories();

    useEffect(() => {
        fetchCategories().catch(() => {
            // Keep form usable even if category suggestions fail to load.
        });

        const loadProduct = async () => {
            try {
                const res = await inventoryApi.getItemById(id);
                loadProductData(res.item);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load product";
                setFormError(message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadProduct();
        }
    }, [id, fetchCategories, loadProductData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setFormError("Authentication token missing. Please log in again.");
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            await inventoryApi.updateItem(token, id, serializeFormData());
            router.push("/admin/products");
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update product";
            setFormError(message);
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Edit Product: {formData.name}</h1>
                    <p className={styles.subtitle}>Update the details of your inventory item.</p>
                </div>
                <div className={styles.headerActions}>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/products')}>
                        <ArrowLeft size={15} />
                        <span>Back to Products</span>
                    </button>
                </div>
            </div>

            <ProductForm
                mode="edit"
                formData={formData}
                loading={loading}
                saving={saving}
                error={formError}
                categories={categories}
                onFormChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                skuDisabled={true}
                stockDisabled={true}
            />
        </div>
    );
}
