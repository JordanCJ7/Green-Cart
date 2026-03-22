import { useState } from "react";
import { InventoryItem } from "@/lib/inventory-api";
import { ProductFormData } from "../_components/ProductForm";

const CATEGORY_ALIASES: Record<string, string> = {
    "dairy & beverages": "Dairy & Chilled",
    "dairy and beverages": "Dairy & Chilled",
    "daily & beverages": "Dairy & Chilled",
    "daily and beverages": "Dairy & Chilled"
};

function normalizeCategoryForForm(value: string | undefined): string {
    const normalized = (value ?? "").trim().replaceAll(/\s+/g, " ");
    const alias = CATEGORY_ALIASES[normalized.toLowerCase()];
    return alias ?? normalized;
}

export function useProductForm() {
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        description: "",
        category: "",
        sku: "",
        price: "",
        compareAtPrice: "",
        stock: "",
        lowStockThreshold: "10",
        unit: "",
        imagesInput: "",
        isActive: true,
    });

    const parseImageUrls = (imagesInput: string): string[] => {
        if (!imagesInput.trim()) {
            return [];
        }

        return Array.from(
            new Set(
                imagesInput
                    .split(/[\n,]+/)
                    .map((entry) => entry.trim())
                    .filter((entry) => entry.length > 0)
            )
        );
    };

    const validateImageUrls = (urls: string[]): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        urls.forEach((url, index) => {
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                    errors.push(
                        `Image ${index + 1}: Firebase Storage URLs must use HTTPS. ` +
                        `In Firebase Console, right-click the file → Download URL to get the HTTPS link. ` +
                        `Protocol found: ${parsed.protocol}`
                    );
                }
            } catch {
                errors.push(`Image ${index + 1}: Invalid URL format - ${url}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
        };
    };

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
            category: normalizeCategoryForForm(item.category),
            sku: item.sku || "",
            price: item.price?.toString() || "",
            compareAtPrice: item.compareAtPrice?.toString() || "",
            stock: item.stock?.toString() || "",
            lowStockThreshold: item.lowStockThreshold?.toString() || "10",
            unit: item.unit || "",
            imagesInput: item.images?.join("\n") || "",
            isActive: item.isActive !== false,
        });
    };

    const serializeFormData = () => {
        const normalizedCategory = formData.category.trim().replaceAll(/\s+/g, " ");
        if (!normalizedCategory) {
            throw new Error("Category is required.");
        }

        const images = parseImageUrls(formData.imagesInput);
        const urlValidation = validateImageUrls(images);
        if (!urlValidation.valid) {
            throw new Error(urlValidation.errors.join(" "));
        }

        return {
            name: formData.name,
            description: formData.description,
            category: normalizedCategory,
            sku: formData.sku,
            price: Number.parseFloat(formData.price) || 0,
            compareAtPrice: formData.compareAtPrice ? Number.parseFloat(formData.compareAtPrice) : undefined,
            stock: Number.parseInt(formData.stock) || 0,
            lowStockThreshold: Number.parseInt(formData.lowStockThreshold) || 10,
            unit: formData.unit,
            images,
            isActive: formData.isActive,
        };
    };

    return {
        formData,
        setFormData,
        handleChange,
        loadProductData,
        serializeFormData,
    };
}
