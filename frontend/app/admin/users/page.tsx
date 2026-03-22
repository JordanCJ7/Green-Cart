"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiDeleteUser, apiListUsers, apiUpdateUserRole, type AuthUser } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import styles from "./users.module.css";

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyUserId, setBusyUserId] = useState<string | null>(null);

    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await apiListUsers();
                setUsers(response.users);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load users.");
            } finally {
                setLoading(false);
            }
        }

        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return users;

        return users.filter((u) =>
            u.email.toLowerCase().includes(normalized) ||
            (u.phone ?? "").toLowerCase().includes(normalized) ||
            u.role.toLowerCase().includes(normalized)
        );
    }, [users, query]);

    async function handleRoleChange(userId: string, role: "customer" | "admin") {
        setBusyUserId(userId);
        setError(null);
        try {
            const response = await apiUpdateUserRole(userId, role);
            setUsers((prev) => prev.map((u) => (u._id === userId ? response.user : u)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update user role.");
        } finally {
            setBusyUserId(null);
        }
    }

    async function handleDelete(userId: string, email: string) {
        const confirmed = window.confirm(`Delete user ${email}? This action cannot be undone.`);
        if (!confirmed) return;

        setBusyUserId(userId);
        setError(null);
        try {
            await apiDeleteUser(userId);
            setUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete user.");
        } finally {
            setBusyUserId(null);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>User Management</h1>
                    <p>View all registered users and manage account roles.</p>
                </div>
                <input
                    className={styles.search}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by email, phone, or role"
                />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {loading ? (
                <p className={styles.loading}>Loading users...</p>
            ) : (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={styles.empty}>No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const isCurrentUser = currentUser?._id === u._id;
                                    const isBusy = busyUserId === u._id;

                                    return (
                                        <tr key={u._id}>
                                            <td data-label="Email" className={styles.email}>{u.email}</td>
                                            <td data-label="Phone">{u.phone || "-"}</td>
                                            <td data-label="Role">
                                                <span className={`${styles.roleBadge} ${u.role === "admin" ? styles.adminBadge : styles.customerBadge}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td data-label="Joined">{formatDate(u.createdAt)}</td>
                                            <td data-label="Actions" className={styles.actions}>
                                                <select
                                                    className={styles.roleSelect}
                                                    value={u.role}
                                                    disabled={isBusy || isCurrentUser}
                                                    onChange={(e) => handleRoleChange(u._id, e.target.value as "customer" | "admin")}
                                                    title={isCurrentUser ? "You cannot change your own role." : "Change role"}
                                                >
                                                    <option value="customer">customer</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                                <button
                                                    className={styles.deleteBtn}
                                                    disabled={isBusy || isCurrentUser}
                                                    onClick={() => handleDelete(u._id, u.email)}
                                                    title={isCurrentUser ? "You cannot delete your own account." : "Delete user"}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
