/**
 * Typed wrappers around the authentication microservice API.
 * Tokens are stored in both cookies (for middleware) and localStorage (for easy client access).
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface AdminUsersResponse {
  users: AuthUser[];
}

// ─── Cookie helpers (edge middleware needs these) ─────────────────────────

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// ─── Token storage ─────────────────────────────────────────────────────────

export function storeTokens(tokens: AuthTokens, role: string) {
  localStorage.setItem("gc_access_token", tokens.accessToken);
  localStorage.setItem("gc_refresh_token", tokens.refreshToken);
  // Cookies for middleware visibility
  setCookie("gc_access_token", tokens.accessToken, 1 / 96); // 15 minutes
  setCookie("gc_refresh_token", tokens.refreshToken, 7);
  setCookie("gc_user_role", role, 7);
}

export function clearTokens() {
  localStorage.removeItem("gc_access_token");
  localStorage.removeItem("gc_refresh_token");
  deleteCookie("gc_access_token");
  deleteCookie("gc_refresh_token");
  deleteCookie("gc_user_role");
}

export function getAccessToken(): string | null {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem("gc_access_token");
}

export function getRefreshToken(): string | null {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem("gc_refresh_token");
}

// ─── API fetch helper ──────────────────────────────────────────────────────

async function authFetch<T>(
  path: string,
  init?: RequestInit,
  withAuth = false
): Promise<T> {
  const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!authApiUrl) {
    throw new Error("NEXT_PUBLIC_AUTH_API_URL is not set; unable to contact authentication service.");
  }
  const url = `${authApiUrl.replace(/\/$/, "")}${path}`;

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers, cache: "no-store" });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Auth API calls ────────────────────────────────────────────────────────

export async function apiRegister(email: string, phone: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, phone, password })
  });
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function apiLogout(refreshToken: string): Promise<void> {
  return authFetch<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export async function apiRefresh(refreshToken: string): Promise<{ accessToken: string }> {
  return authFetch<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export async function apiMe(): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>("/auth/me", {}, true);
}

export async function apiListUsers(): Promise<AdminUsersResponse> {
  return authFetch<AdminUsersResponse>("/auth/users", {}, true);
}

export async function apiUpdateUserRole(id: string, role: "customer" | "admin"): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>(`/auth/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  }, true);
}

export async function apiDeleteUser(id: string): Promise<void> {
  return authFetch<void>(`/auth/users/${id}`, {
    method: "DELETE"
  }, true);
}
