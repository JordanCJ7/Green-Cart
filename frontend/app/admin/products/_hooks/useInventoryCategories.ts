import { useCallback, useState } from "react";
import { inventoryApi } from "@/lib/inventory-api";

function normalizeCategory(value: string): string {
    return value.trim().replaceAll(/\s+/g, " ");
}

export function useInventoryCategories() {
    const [categories, setCategories] = useState<string[]>([]);

    const fetchCategories = useCallback(async () => {
        const response = await inventoryApi.getCategories();
        const normalized = response.categories
            .map(normalizeCategory)
            .filter((category) => category.length > 0)
            .sort((a, b) => a.localeCompare(b));

        setCategories(Array.from(new Set(normalized)));
    }, []);

    const addCategory = useCallback((category: string) => {
        const normalized = normalizeCategory(category);
        if (!normalized) {
            return;
        }

        setCategories((prev) => {
            if (prev.includes(normalized)) {
                return prev;
            }

            return [...prev, normalized].sort((a, b) => a.localeCompare(b));
        });
    }, []);

    return {
        categories,
        fetchCategories,
        addCategory,
    };
}
