import { apiFetch } from "./api";

export interface Supplier {
    _id: string;
    name: string;
    contact: string;
    phone: string;
    status: "Active" | "Inactive" | "Under Review";
    reliability: number;
    lastDelivery?: string;
    categories: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SupplierStats {
    total: number;
    active: number;
    deliveriesThisWeek: number;
}

export const supplierApi = {
    async getAll(): Promise<{ suppliers: Supplier[] }> {
        return apiFetch<{ suppliers: Supplier[] }>("inventory", "/suppliers");
    },

    async getStats(): Promise<SupplierStats> {
        return apiFetch<SupplierStats>("inventory", "/suppliers/stats");
    },

    async create(
        token: string,
        data: { name: string; contact: string; phone?: string; categories?: string; notes?: string }
    ): Promise<{ supplier: Supplier }> {
        return apiFetch<{ supplier: Supplier }>("inventory", "/suppliers", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });
    },

    async update(
        token: string,
        id: string,
        data: Partial<Omit<Supplier, "_id" | "createdAt" | "updatedAt">> & { categories?: string }
    ): Promise<{ supplier: Supplier }> {
        return apiFetch<{ supplier: Supplier }>("inventory", `/suppliers/${id}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });
    },

    async delete(token: string, id: string): Promise<void> {
        return apiFetch<void>("inventory", `/suppliers/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
