"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import styles from "../auth.module.css";

// Simple email validation without backtracking-prone regex
function isValidEmail(email: string): boolean {
    const atIndex = email.indexOf("@");
    const lastDotIndex = email.lastIndexOf(".");
    
    return (
        atIndex > 0 &&
        lastDotIndex > atIndex + 1 &&
        lastDotIndex < email.length - 1 &&
        email.length <= 254
    );
}

const PASSWORD_STRENGTH_LEVELS = [
    { label: "Too short", color: "#e5e7eb", width: "0%" },
    { label: "Weak", color: "#ef4444", width: "25%" },
    { label: "Fair", color: "#f59e0b", width: "50%" },
    { label: "Good", color: "#3b82f6", width: "75%" },
    { label: "Strong", color: "#16a34a", width: "100%" }
];

function validatePasswordStrength(pw: string): boolean {
    if (pw.length < 8) return false;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSpecial = /[@$!%*?&]/.test(pw);
    return hasLower && hasUpper && hasDigit && hasSpecial;
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string; width: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z\d]/.test(pw)) score++;

    const idx = pw.length === 0 ? 0 : Math.min(score, 4);
    return { score: idx, ...PASSWORD_STRENGTH_LEVELS[idx] };
}

function getStrengthColorClass(score: number, styles: Record<string, string>): string {
    if (score <= 1) return styles.strengthWeak;
    if (score === 2) return styles.strengthFair;
    if (score === 3) return styles.strengthGood;
    return styles.strengthStrong;
}

// Phone validation function
function isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 10;
}

function requirementClass(condition: boolean, styles: Record<string, string>): string {
    return condition ? styles.ruleMet : styles.ruleUnmet;
}

export default function RegisterPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
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

        // Client-side validation
        if (!email.trim()) {
            setError("Email is required");
            return;
        }
        // Simple email validation without backtracking-prone regex
        if (!isValidEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }
        if (!phone.trim()) {
            setError("Phone number is required");
            return;
        }
        if (!isValidPhone(phone)) {
            setError("Phone number must be at least 10 digits");
            return;
        }
        if (!password.trim()) {
            setError("Password is required");
            return;
        }
        if (!confirm.trim()) {
            setError("Please confirm your password");
            return;
        }
        if (mismatch) {
            setError("Passwords do not match");
            return;
        }
        if (!validatePasswordStrength(password)) {
            setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
            return;
        }
        setError(null);

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await register(email, phone, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>Join Green-Cart – fresh produce delivered fast</p>

            {error && (
                <div className={`alert alert-error ${styles.alertBlock}`} role="alert">
                    <AlertTriangle size={16} /> {error}
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
                    <label className="form-label" htmlFor="phone">Phone number</label>
                    <input
                        id="phone"
                        type="tel"
                        className="form-input"
                        placeholder="+1 (555) 123-4567 or 5551234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
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
                            placeholder="Min. 8 chars: uppercase, lowercase, number, special char"
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
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
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
                            <p className={`${styles.strengthLabel} ${getStrengthColorClass(strength.score, styles)}`}>
                                {strength.label}
                            </p>
                            <div className={styles.rulesBlock}>
                                <p className={styles.rulesTitle}>Requirements</p>
                                <ul className={styles.rulesList}>
                                    <li className={`${styles.ruleItem} ${requirementClass(password.length >= 8, styles)}`}>
                                        <span>✓</span> At least 8 characters
                                    </li>
                                    <li className={`${styles.ruleItem} ${requirementClass(/[A-Z]/.test(password), styles)}`}>
                                        <span>✓</span> Uppercase (A-Z)
                                    </li>
                                    <li className={`${styles.ruleItem} ${requirementClass(/[a-z]/.test(password), styles)}`}>
                                        <span>✓</span> Lowercase (a-z)
                                    </li>
                                    <li className={`${styles.ruleItem} ${requirementClass(/\d/.test(password), styles)}`}>
                                        <span>✓</span> Number (0-9)
                                    </li>
                                    <li className={`${styles.ruleItem} ${requirementClass(/[@$!%*?&]/.test(password), styles)}`}>
                                        <span>✓</span> Special char (@$!%*?&)
                                    </li>
                                </ul>
                            </div>
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
