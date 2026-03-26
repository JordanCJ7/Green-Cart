import { apiFetch } from "./api";
import { getAccessToken } from "./auth";

export interface WishlistItem {
  itemId: string;
  name: string;
  sku: string;
  price: number;
  image?: string;
  addedAt: string;
}

export interface Wishlist {
  _id?: string;
  customerId: string;
  items: WishlistItem[];
  createdAt?: string;
  updatedAt?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Please login to use wishlist. Access token not found.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function apiGetWishlist(): Promise<Wishlist> {
  return apiFetch<Wishlist>("inventory", "/wishlist", {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export async function apiAddToWishlist(itemId: string): Promise<Wishlist> {
  return apiFetch<Wishlist>("inventory", "/wishlist", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemId }),
  });
}

export async function apiRemoveFromWishlist(itemId: string): Promise<Wishlist> {
  return apiFetch<Wishlist>("inventory", `/wishlist/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

export async function apiCheckWishlisted(itemIds: string[]): Promise<Record<string, boolean>> {
  return apiFetch<Record<string, boolean>>("inventory", "/wishlist/check-wishlisted", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemIds }),
  });
}

export async function apiClearWishlist(): Promise<Wishlist> {
  return apiFetch<Wishlist>("inventory", "/wishlist", {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}
