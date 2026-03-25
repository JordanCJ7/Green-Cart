/**
 * Typed wrappers around the notification microservice API.
 */
import { apiFetch } from "./api";
import { getAccessToken } from "./auth";

// ─── Types ─────────────────────────────────────────────────────────────────

export type NotificationType =
  | "inventory_added"
  | "inventory_updated"
  | "inventory_deleted"
  | "order_placed"
  | "order_accepted"
  | "order_rejected"
  | "cart_item_added"
  | "payment_completed"
  | "payment_failed";

export type NotificationRole = "admin" | "customer";

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  role: NotificationRole;
  read: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ─── Notification API Calls ────────────────────────────────────────────────

export async function fetchNotifications(
  role?: "admin" | "customer",
  read?: boolean
): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (read !== undefined) params.set("read", String(read));
  const query = params.toString();
  const path = `/notifications${query ? `?${query}` : ""}`;

  const res = await apiFetch<{ notifications: Notification[] }>("notification", path, {
    headers: authHeaders(),
  });
  return res.notifications;
}

export async function fetchNotificationStats(
  role?: "admin" | "customer"
): Promise<NotificationStats> {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  const query = params.toString();
  const path = `/notifications/stats${query ? `?${query}` : ""}`;

  return apiFetch<NotificationStats>("notification", path, {
    headers: authHeaders(),
  });
}

export async function markAsRead(id: string): Promise<Notification> {
  return apiFetch<Notification>("notification", `/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function markAllAsRead(
  role?: "admin" | "customer"
): Promise<{ modifiedCount: number }> {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  const query = params.toString();
  const path = `/notifications/read-all${query ? `?${query}` : ""}`;

  return apiFetch<{ modifiedCount: number }>("notification", path, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch<void>("notification", `/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function createNotification(data: {
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  role: NotificationRole;
  metadata?: Record<string, string>;
  phoneNumber?: string;
}): Promise<Notification> {
  return apiFetch<Notification>("notification", "/notifications", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

// ─── Convenience helpers for common notification scenarios ─────────────

/**
 * Notify when a customer adds an item to their cart (in-app only).
 */
export async function notifyCartItemAdded(
  userId: string,
  itemName: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: "cart_item_added",
    title: "Item Added to Cart",
    message: `"${itemName}" has been added to your cart.`,
    role: "customer",
  });
}

/**
 * Notify when a customer places an order (in-app only).
 */
export async function notifyOrderPlaced(
  userId: string,
  orderId: string,
  total: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: "order_placed",
    title: "Order Placed Successfully",
    message: `Your order #${orderId} totalling ${total} has been placed.`,
    role: "customer",
  });
}

/**
 * Notify customer when admin accepts an order (in-app + SMS via Twilio).
 */
export async function notifyOrderAccepted(
  userId: string,
  orderId: string,
  phoneNumber?: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: "order_accepted",
    title: "Order Accepted",
    message: `Your order #${orderId} has been accepted and is being prepared.`,
    role: "customer",
    phoneNumber,
  });
}

/**
 * Notify customer when admin rejects an order (in-app + SMS via Twilio).
 */
export async function notifyOrderRejected(
  userId: string,
  orderId: string,
  reason: string,
  phoneNumber?: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: "order_rejected",
    title: "Order Rejected",
    message: `Your order #${orderId} has been rejected. Reason: ${reason}`,
    role: "customer",
    phoneNumber,
  });
}

// ─── Analytics Types & Calls ───────────────────────────────────────────────

export interface MonthlyAnalytics {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  monthly: MonthlyAnalytics[];
}

export async function fetchAnalytics(
  year?: number,
  role?: "admin" | "customer"
): Promise<AnalyticsSummary> {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (role) params.set("role", role);
  const query = params.toString();
  const path = `/analytics${query ? `?${query}` : ""}`;

  return apiFetch<AnalyticsSummary>("notification", path, {
    headers: authHeaders(),
  });
}
