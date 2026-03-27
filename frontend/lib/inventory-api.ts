import { apiFetch } from "./api";

export interface InventoryItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  images?: string[];
  isActive: boolean;
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

export interface CategoryListResponse {
  categories: string[];
}

export const inventoryApi = {
  async getItems(params?: Record<string, string>): Promise<PaginatedItems> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch<PaginatedItems>("inventory", `/${query}`);
  },

  async getItemById(id: string): Promise<{ item: InventoryItem }> {
    return apiFetch<{ item: InventoryItem }>("inventory", `/${id}`);
  },

  async getCategories(): Promise<CategoryListResponse> {
    return apiFetch<CategoryListResponse>("inventory", "/categories");
  },

  async createItem(token: string, data: Partial<InventoryItem>): Promise<{ item: InventoryItem }> {
    return apiFetch<{ item: InventoryItem }>("inventory", "/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async updateItem(token: string, id: string, data: Partial<InventoryItem>): Promise<{ item: InventoryItem }> {
    return apiFetch<{ item: InventoryItem }>("inventory", `/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async deleteItem(token: string, id: string): Promise<void> {
    return apiFetch<void>("inventory", `/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
};
