"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "./auth";
import {
    apiRegister,
    apiLogin,
    apiLogout,
    apiMe,
    storeTokens,
    clearTokens,
    getAccessToken,
    getRefreshToken
} from "./auth";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
    user: AuthUser | null;
    loading: boolean;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, phone: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const [state, setState] = useState<AuthState>({ user: null, loading: true });

    // Rehydrate session from stored token on mount
    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            setState({ user: null, loading: false });
            return;
        }
        apiMe()
            .then(({ user }) => setState({ user, loading: false }))
            .catch(() => {
                clearTokens();
                setState({ user: null, loading: false });
            });
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { user, accessToken, refreshToken } = await apiLogin(email, password);
        storeTokens({ accessToken, refreshToken }, user.role);
        setState({ user, loading: false });
        if (user.role === "admin") {
            router.push("/admin/dashboard");
        } else {
            router.push("/customer/dashboard");
        }
    }, [router]);

    const register = useCallback(async (email: string, phone: string, password: string) => {
        const { user, accessToken, refreshToken } = await apiRegister(email, phone, password);
        storeTokens({ accessToken, refreshToken }, user.role);
        setState({ user, loading: false });
        router.push("/customer/dashboard");
    }, [router]);

    const logout = useCallback(async () => {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try { await apiLogout(refreshToken); } catch { /* ignore */ }
        }
        clearTokens();
        setState({ user: null, loading: false });
        router.push("/login");
    }, [router]);

    const value = React.useMemo(() => ({ ...state, login, register, logout }), [state, login, register, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
