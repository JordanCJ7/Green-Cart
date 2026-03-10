"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "../auth.module.css";

function getPasswordStrength(pw: string): { score: number; label: string; color: string; width: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
        { label: "Too short", color: "#e5e7eb", width: "0%" },
        { label: "Weak", color: "#ef4444", width: "25%" },
        { label: "Fair", color: "#f59e0b", width: "50%" },
        { label: "Good", color: "#3b82f6", width: "75%" },
        { label: "Strong", color: "#16a34a", width: "100%" }
    ];
    const idx = pw.length === 0 ? 0 : Math.min(score, 4);
    return { score: idx, ...levels[idx] };
}

export default function RegisterPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const strength = getPasswordStrength(password);
    const mismatch = confirm.length > 0 && confirm !== password;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);
        try {
            await register(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1 className={styles.title}>Create your account ✨</h1>
            <p className={styles.subtitle}>Join Green-Cart – fresh produce delivered fast</p>

            {error && (
                <div className="alert alert-error" role="alert" style={{ marginBottom: "1rem" }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
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
                    {password.length > 0 && (
                        <>
                            <div className={styles.strengthBar}>
                                <div
                                    className={styles.strengthFill}
                                    style={{ width: strength.width, background: strength.color }}
                                />
                            </div>
                            <p className={`${styles.strengthLabel} ${strength.score <= 1 ? styles.strengthWeak :
                                    strength.score === 2 ? styles.strengthFair :
                                        strength.score === 3 ? styles.strengthGood :
                                            styles.strengthStrong
                                }`}>
                                {strength.label}
                            </p>
                        </>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="confirm">Confirm password</label>
                    <input
                        id="confirm"
                        type={showPw ? "text" : "password"}
                        className={`form-input ${mismatch ? "error" : ""}`}
                        placeholder="Repeat your password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                    {mismatch && <p className="form-error">Passwords do not match</p>}
                </div>

                <p className="form-hint">
                    By creating an account you agree to our{" "}
                    <Link href="#">Terms of Service</Link> and{" "}
                    <Link href="#">Privacy Policy</Link>.
                </p>

                <div className={styles.actions}>
                    <button
                        type="submit"
                        id="register-submit"
                        className={`btn btn-primary btn-full btn-lg ${loading ? "btn-loading" : ""}`}
                        disabled={loading || mismatch}
                    >
                        {loading ? <span className="btn-spinner" /> : null}
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </div>
            </form>

            <p className={styles.footer}>
                Already have an account? <Link href="/login">Sign in</Link>
            </p>
        </>
    );
}
