import { useState } from "react";
import { inventoryApi, InventoryItem } from "@/lib/inventory-api";
import { ProductFormData } from "../_components/ProductForm";

export function useProductForm(initialMode: "create" | "edit", onSuccess?: () => void) {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const loadProductData = (item: InventoryItem) => {
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
    };

    const serializeFormData = () => ({
        ...formData,
        price: Number.parseFloat(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? Number.parseFloat(formData.compareAtPrice) : undefined,
        stock: Number.parseInt(formData.stock) || 0,
        lowStockThreshold: Number.parseInt(formData.lowStockThreshold) || 10,
    });

    return {
        formData,
        setFormData,
        handleChange,
        loadProductData,
        serializeFormData,
    };
}
