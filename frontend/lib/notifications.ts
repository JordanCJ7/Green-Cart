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
  | "payment_completed";

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
}): Promise<Notification> {
  return apiFetch<Notification>("notification", "/notifications", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
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
