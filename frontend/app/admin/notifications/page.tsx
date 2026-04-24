"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiAdminNotifications, apiMarkAsRead, type NotificationDto } from "@/lib/notification";
import styles from "./notifications.module.css";

const POLL_INTERVAL_MS = 5000;

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationDto[]>([]);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { notifications } = await apiAdminNotifications({ limit: 50, skip: 0 });
      setItems(notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    // optimistic
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await apiMarkAsRead(id);
    } catch (err) {
      // rollback on error
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  if (user?.role !== "admin") {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Notifications</h1>
        <p className={styles.subtle}>Admin access required.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtle}>New users and inventory changes.</p>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.unreadPill}>Unread: {unreadCount}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      {loading ? <p className={styles.subtle}>Loading…</p> : null}

      <div className={styles.list}>
        {items.length === 0 && !loading ? <p className={styles.subtle}>No notifications yet.</p> : null}
        {items.map((n) => (
          <div key={n.id} className={`${styles.card} ${n.isRead ? "" : styles.unreadCard}`}>
            <div className={styles.cardTop}>
              <span className={styles.typeTag}>{n.type}</span>
              <span className={styles.time}>
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
            <p className={styles.message}>{n.message}</p>
            <div className={styles.cardActions}>
              {!n.isRead ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void markRead(n.id)}>
                  Mark as read
                </button>
              ) : (
                <span className={styles.readHint}>Read</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
