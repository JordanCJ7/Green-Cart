import { apiFetch } from "./api";
import { getAccessToken } from "./auth";

export interface CartItem {
  itemId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  _id?: string;
  customerId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Please login to use cart. Access token not found.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function apiGetCart(): Promise<Cart> {
  return apiFetch<Cart>("inventory", "/cart", {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export async function apiAddToCart(itemId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>("inventory", "/cart", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemId, quantity }),
  });
}

export async function apiUpdateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>("inventory", `/cart/${itemId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity }),
  });
}

export async function apiRemoveFromCart(itemId: string): Promise<Cart> {
  return apiFetch<Cart>("inventory", `/cart/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

export async function apiClearCart(): Promise<Cart> {
  return apiFetch<Cart>("inventory", "/cart", {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}
