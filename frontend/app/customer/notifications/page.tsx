"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Notification,
  NotificationType,
  NotificationStats,
  fetchNotifications,
  fetchNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications";
import styles from "./notifications.module.css";

/* ── colour helpers --------------------------------------------------- */
const TYPE_META: Record<
  NotificationType,
  { icon: string; bg: string; color: string; label: string }
> = {
  inventory_added: { icon: "📦", bg: "rgba(22,163,74,.1)", color: "#16a34a", label: "Added" },
  inventory_updated: { icon: "🔄", bg: "rgba(37,99,235,.1)", color: "#2563eb", label: "Updated" },
  inventory_deleted: { icon: "🗑️", bg: "rgba(220,38,38,.1)", color: "#dc2626", label: "Deleted" },
  order_placed: { icon: "🛒", bg: "rgba(217,119,6,.1)", color: "#d97706", label: "Order" },
  order_accepted: { icon: "✅", bg: "rgba(22,163,74,.1)", color: "#16a34a", label: "Accepted" },
  order_rejected: { icon: "❌", bg: "rgba(220,38,38,.1)", color: "#dc2626", label: "Rejected" },
  payment_completed: { icon: "💳", bg: "rgba(147,51,234,.1)", color: "#9333ea", label: "Payment" },
  cart_item_added: { icon: "🛍️", bg: "rgba(37,99,235,.1)", color: "#2563eb", label: "Cart" },
};

/* ── Mock data -------------------------------------------------------- */
const MOCK_NOTIFICATIONS: Notification[] = [
  { _id: "1", userId: "cust1", type: "order_placed", title: "Order Placed Successfully", message: 'Your order #ORD-1042 with 3 items totalling $45.90 has been placed.', role: "customer", read: false, createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), updatedAt: new Date().toISOString() },
  { _id: "2", userId: "cust1", type: "order_accepted", title: "Order Accepted", message: 'Great news! Your order #ORD-1038 has been accepted and is being prepared.', role: "customer", read: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), updatedAt: new Date().toISOString() },
  { _id: "3", userId: "cust1", type: "payment_completed", title: "Payment Confirmed", message: 'Payment of $128.50 for order #ORD-1035 was successfully processed.', role: "customer", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), updatedAt: new Date().toISOString() },
  { _id: "4", userId: "cust1", type: "cart_item_added", title: "Item Added to Cart", message: '"Organic Apples (1kg)" has been added to your cart.', role: "customer", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), updatedAt: new Date().toISOString() },
  { _id: "5", userId: "cust1", type: "order_rejected", title: "Order Cancelled", message: 'Unfortunately, order #ORD-1030 could not be fulfilled. You will receive a refund.', role: "customer", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), updatedAt: new Date().toISOString() },
];

const MOCK_STATS: NotificationStats = { total: 5, unread: 2, read: 3 };

type FilterType = "all" | NotificationType;
const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "order_placed", label: "Orders" },
  { key: "order_accepted", label: "Accepted" },
  { key: "order_rejected", label: "Rejected" },
  { key: "payment_completed", label: "Payments" },
  { key: "cart_item_added", label: "Cart" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0 });
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [data, st] = await Promise.all([
        fetchNotifications("customer"),
        fetchNotificationStats("customer"),
      ]);
      setNotifications(data);
      setStats(st);
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (id: string) => {
    try { await markAsRead(id); } catch { /* offline */ }
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1), read: prev.read + 1 }));
  };

  const handleReadAll = async () => {
    try { await markAllAsRead("customer"); } catch { /* offline */ }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setStats((prev) => ({ ...prev, unread: 0, read: prev.total }));
  };

  const handleDelete = async (id: string) => {
    try { await deleteNotification(id); } catch { /* offline */ }
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setStats((prev) => ({ ...prev, total: prev.total - 1 }));
  };

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Your orders, payments &amp; cart updates</p>
        </div>
        <div className={styles.headerActions}>
          {stats.unread > 0 && (
            <button className={styles.filterBtn} onClick={handleReadAll}>
              ✓ Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statChip}>
          <span className={styles.statChipIcon}>📬</span>
          <div>
            <div className={styles.statChipLabel}>Total</div>
            <div className={styles.statChipValue}>{stats.total}</div>
          </div>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statChipIcon}>🔵</span>
          <div>
            <div className={styles.statChipLabel}>Unread</div>
            <div className={styles.statChipValue}>{stats.unread}</div>
          </div>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statChipIcon}>✅</span>
          <div>
            <div className={styles.statChipLabel}>Read</div>
            <div className={styles.statChipValue}>{stats.read}</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔔</div>
          <div className={styles.emptyTitle}>No notifications</div>
          <p className={styles.emptyDesc}>
            {filter === "all" ? "You're all caught up!" : `No ${filter.replace("_", " ")} notifications.`}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((n) => {
            const meta = TYPE_META[n.type];
            return (
              <div
                key={n._id}
                className={`${styles.card} ${!n.read ? styles.cardUnread : ""}`}
                onClick={() => !n.read && handleRead(n._id)}
              >
                <div
                  className={styles.iconWrap}
                  style={{ background: meta.bg }}
                >
                  {meta.icon}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{n.title}</div>
                  <p className={styles.cardMessage}>{n.message}</p>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardTime}>{timeAgo(n.createdAt)}</span>
                    <span
                      className={styles.cardType}
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.iconBtn} ${styles.dangerIcon}`}
                    onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
