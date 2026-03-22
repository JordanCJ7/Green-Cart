import { useState, useEffect } from "react";
import { inventoryApi, Category } from "@/lib/inventory-api";
import { getAccessToken } from "@/lib/auth";

export function useCategories() {
    const token = getAccessToken();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        inventoryApi.getCategories()
            .then(res => {
                if (res.categories) setCategories(res.categories);
            })
            .catch(err => console.error(err));
    }, []);

    const handleAddCategory = async (): Promise<Category | null> => {
        if (!token || !newCategoryName.trim()) return null;
        
        setCategoryLoading(true);
        try {
            const cleanName = newCategoryName.trim();
            const slug = cleanName.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
            
            const res = await inventoryApi.createCategory(token, { name: cleanName, slug });
            if (res.category) {
                setCategories(prev => [...prev, res.category]);
                setIsAddingCategory(false);
                setNewCategoryName("");
                setError(null);
                return res.category;
            }
            return null;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create category";
            setError(message);
            return null;
        } finally {
            setCategoryLoading(false);
        }
    };

    return {
        categories,
        isAddingCategory,
        setIsAddingCategory,
        newCategoryName,
        setNewCategoryName,
        categoryLoading,
        error,
        setError,
        handleAddCategory
    };
}
