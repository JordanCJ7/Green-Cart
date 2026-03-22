"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { inventoryApi } from "@/lib/inventory-api";
import { ProductForm, ProductFormData } from "../_components/ProductForm";
import { useCategories } from "../_hooks/useCategories";
import styles from "../../admin.module.css";

export default function EditProductPage() {
    const token = getAccessToken();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
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
                setFormError(message);
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
        setFormError(null);

        try {
            await inventoryApi.updateItem(token, id, {
                ...formData,
                price: Number.parseFloat(formData.price) || 0,
                compareAtPrice: formData.compareAtPrice ? Number.parseFloat(formData.compareAtPrice) : undefined,
                stock: Number.parseInt(formData.stock) || 0,
                lowStockThreshold: Number.parseInt(formData.lowStockThreshold) || 10,
            });
            router.push("/admin/products");
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update product";
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
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Edit Product: {formData.name}</h1>
                    <p className={styles.subtitle}>Update the details of your inventory item.</p>
                </div>
            </div>

            <ProductForm
                mode="edit"
                formData={formData}
                categories={categoryHook.categories}
                loading={loading}
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
                skuDisabled={true}
                stockDisabled={true}
            />
        </div>
    );
}
