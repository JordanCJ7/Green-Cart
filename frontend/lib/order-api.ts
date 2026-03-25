import { apiFetch } from "./api";
import { getAccessToken } from "./auth";

export interface OrderItem {
  itemId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  _id?: string;
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "shipped" | "delivered";
  transactionId?: string;
  payHereId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Please login to view orders. Access token not found.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function apiCreateOrder(): Promise<Order> {
  return apiFetch<Order>("inventory", "/orders", {
    method: "POST",
    headers: getAuthHeaders(),
  });
}

export async function apiGetOrders(limit: number = 20, offset: number = 0): Promise<OrdersResponse> {
  return apiFetch<OrdersResponse>(
    "inventory",
    `/orders?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
}

export async function apiGetOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>("inventory", `/orders/${orderId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export async function apiUpdateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<Order> {
  return apiFetch<Order>("inventory", `/orders/${orderId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
}
