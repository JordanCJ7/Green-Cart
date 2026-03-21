import { apiFetch } from "./api";

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  weight?: number;
  shelfLife?: number;
  images?: string[];
  certifications?: string[];
  isActive: boolean;
  category?: Category | string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedItems {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const inventoryApi = {
  async getItems(params?: Record<string, string>): Promise<PaginatedItems> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch<PaginatedItems>("inventory", `/inventory${query}`);
  },

  async getItemById(id: string): Promise<{ item: InventoryItem }> {
    return apiFetch<{ item: InventoryItem }>("inventory", `/inventory/${id}`);
  },

  async createItem(token: string, data: Partial<InventoryItem>): Promise<{ item: InventoryItem }> {
    return apiFetch<{ item: InventoryItem }>("inventory", "/inventory", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async updateItem(token: string, id: string, data: Partial<InventoryItem>): Promise<{ item: InventoryItem }> {
    return apiFetch<{ item: InventoryItem }>("inventory", `/inventory/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async deleteItem(token: string, id: string): Promise<void> {
    return apiFetch<void>("inventory", `/inventory/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getCategories(): Promise<{ categories: Category[] }> {
      try {
          return await apiFetch<{ categories: Category[] }>("inventory", "/categories");
      } catch {
          // If categories fail, return empty list gracefully
          return { categories: [] };
      }
  },

  async createCategory(token: string, data: { name: string, slug?: string }): Promise<{ category: Category }> {
      return apiFetch<{ category: Category }>("inventory", "/categories", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
      });
  }
};
