"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "../auth.module.css";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Client-side validation
        if (!email.trim()) {
            setError("Email is required");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return;
        }
        if (!password.trim()) {
            setError("Password is required");
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1 className={styles.title}>Welcome back 👋</h1>
            <p className={styles.subtitle}>Sign in to your Green-Cart account</p>

            {error && (
                <div className="alert alert-error" role="alert" style={{ marginBottom: "1rem" }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            id="password"
                            type={showPw ? "text" : "password"}
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setShowPw((v) => !v)}
                            aria-label={showPw ? "Hide password" : "Show password"}
                        >
                            {showPw ? "🙈" : "👁️"}
                        </button>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="submit"
                        id="login-submit"
                        className={`btn btn-primary btn-full btn-lg ${loading ? "btn-loading" : ""}`}
                        disabled={loading}
                    >
                        {loading ? <span className="btn-spinner" /> : null}
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </div>
            </form>

            <p className={styles.footer}>
                Don&apos;t have an account?{" "}
                <Link href="/register">Create one for free</Link>
            </p>
        </>
    );
}
