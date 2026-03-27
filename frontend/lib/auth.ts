/**
 * Typed wrappers around the authentication microservice API.
 * Tokens are stored in both cookies (for middleware) and localStorage (for easy client access).
 */

import { ApiError, apiFetch } from "./api";

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

export interface UpdateMeInput {
  email?: string;
  phone?: string;
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

// ─── Typed error for API failures ─────────────────────────────────────────

class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

// ─── Retry logic for rate limiting ─────────────────────────────────────────

interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000
};

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // If it's a 429 rate limit error, retry with backoff
      if (err instanceof AuthApiError && err.status === 429) {
        if (attempt < config.maxAttempts - 1) {
          const delayMs = Math.min(
            config.initialDelayMs * Math.pow(2, attempt),
            config.maxDelayMs
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      } else {
        // For non-rate-limit errors, fail immediately
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Request failed after all retry attempts");
}

// ─── API fetch helper ──────────────────────────────────────────────────────

async function authFetch<T>(
  path: string,
  init?: RequestInit,
  withAuth = false
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  try {
    return await apiFetch<T>("authentication", path, { ...init, headers });
  } catch (err) {
    if (err instanceof ApiError) {
      let message = err.message;
      let code: string | undefined;

      if (err.bodyText) {
        try {
          const body = JSON.parse(err.bodyText) as { message?: string; error?: string; code?: string };
          message = body.message ?? body.error ?? message;
          code = body.code;
        } catch {
          // ignore parse errors and keep fallback message
        }
      }

      throw new AuthApiError(message, err.status, code);
    }

    throw err;
  }
}

// ─── Auth API calls ────────────────────────────────────────────────────────

export async function apiRegister(email: string, phone: string, password: string): Promise<AuthResponse> {
  return withRetry(() =>
    authFetch<AuthResponse>("/register", {
      method: "POST",
      body: JSON.stringify({ email, phone, password })
    })
  );
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return withRetry(() =>
    authFetch<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    })
  );
}

export async function apiLogout(refreshToken: string): Promise<void> {
  return authFetch<void>("/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export async function apiRefresh(refreshToken: string): Promise<{ accessToken: string }> {
  return authFetch<{ accessToken: string }>("/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export async function apiMe(): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>("/me", {}, true);
}

export async function apiUpdateMe(input: UpdateMeInput): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>("/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  }, true);
}

export async function apiDeleteMe(): Promise<void> {
  return authFetch<void>("/me", {
    method: "DELETE"
  }, true);
}

export async function apiListUsers(): Promise<AdminUsersResponse> {
  return authFetch<AdminUsersResponse>("/users", {}, true);
}

export async function apiUpdateUserRole(id: string, role: "customer" | "admin"): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>(`/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  }, true);
}

export async function apiDeleteUser(id: string): Promise<void> {
  return authFetch<void>(`/users/${id}`, {
    method: "DELETE"
  }, true);
}
