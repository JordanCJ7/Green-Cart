"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi } from "@/lib/inventory-api";
import { ProductForm } from "../_components/ProductForm";
import { useProductForm } from "../_hooks/useProductForm";
import styles from "../products-page.module.css";

export default function NewProductPage() {
    const token = getAccessToken();
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { formData, handleChange, serializeFormData } = useProductForm();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setSaving(true);
        setFormError(null);

        try {
            await inventoryApi.createItem(token, serializeFormData());
            router.push("/admin/products");
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create product";
            setFormError(message);
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Add New Product</h1>
                    <p className={styles.subtitle}>Create a new item in your catalog.</p>
                </div>
                <div className={styles.headerActions}>
                    <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/dashboard')}>
                        <ArrowLeft size={15} />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </div>

            <ProductForm
                mode="create"
                formData={formData}
                loading={false}
                saving={saving}
                error={formError}
                onFormChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
            />
        </div>
    );
}
