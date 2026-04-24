import { apiFetch } from "./api";
import { getAccessToken } from "./auth";

export type NotificationType = "inventory" | "user" | "payment";

export interface NotificationDto {
  id: string;
  type: NotificationType;
  message: string;
  userId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  title?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

function withAuth(init?: RequestInit): RequestInit {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
}

export async function apiAdminNotifications(params?: { limit?: number; skip?: number; read?: boolean }): Promise<{ notifications: NotificationDto[] }> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.skip !== undefined) q.set("skip", String(params.skip));
  if (params?.read !== undefined) q.set("read", params.read ? "true" : "false");
  const path = `/notifications/admin${q.toString() ? `?${q.toString()}` : ""}`;
  return apiFetch("notification", path, withAuth());
}

export async function apiUserNotifications(userId: string, params?: { limit?: number; skip?: number; read?: boolean }): Promise<{ notifications: NotificationDto[]; unreadCount: number }> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.skip !== undefined) q.set("skip", String(params.skip));
  if (params?.read !== undefined) q.set("read", params.read ? "true" : "false");
  const path = `/notifications/user/${encodeURIComponent(userId)}${q.toString() ? `?${q.toString()}` : ""}`;
  return apiFetch("notification", path, withAuth());
}

export async function apiUnreadCount(): Promise<{ unreadCount: number }> {
  return apiFetch("notification", "/notifications/unread", withAuth());
}

export async function apiMarkAsRead(id: string): Promise<NotificationDto> {
  return apiFetch("notification", `/notifications/${encodeURIComponent(id)}/read`, withAuth({ method: "PATCH" }));
}
