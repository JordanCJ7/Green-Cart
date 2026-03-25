"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Save, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGetOrders } from "@/lib/order-api";
import { inventoryApi } from "@/lib/inventory-api";
import styles from "./profile.module.css";

export default function CustomerProfilePage() {
  const { user, updateMe, deleteMe } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [savingsLkr, setSavingsLkr] = useState(0);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadSavings = async () => {
      try {
        // Paginate orders to avoid fetching a large fixed batch
        const pageSize = 50;
        const maxOrdersToFetch = 200;
        let offset = 0;
        const allOrders: Array<Awaited<ReturnType<typeof apiGetOrders>>["orders"][0]> = [];

        // Fetch orders in pages until we either exhaust them or reach the cap
        while (allOrders.length < maxOrdersToFetch) {
          const remaining = maxOrdersToFetch - allOrders.length;
          const currentLimit = Math.min(pageSize, remaining);
          const page = await apiGetOrders(currentLimit, offset);

          if (!page.orders.length) {
            break;
          }

          allOrders.push(...page.orders);
          offset += page.orders.length;

          if (page.orders.length < currentLimit) {
            break;
          }
        }

        // If there are no orders, there are no savings
        if (!allOrders.length) {
          setSavingsLkr(0);
          return;
        }

        // Collect unique itemIds from all order items
        const itemIdSet = new Set<string>();
        for (const order of allOrders) {
          for (const item of order.items) {
            if (item.itemId) {
              itemIdSet.add(item.itemId);
            }
          }
        }

        if (!itemIdSet.size) {
          setSavingsLkr(0);
          return;
        }

        const itemIdsArray = Array.from(itemIdSet);

        // Fetch only the inventory items corresponding to the user's order items
        const inventory = await inventoryApi.getItems({
          limit: String(itemIdsArray.length),
          isActive: "true",
          itemIds: itemIdsArray.join(",")
        });

        const compareAtMap = new Map<string, number>();
        for (const item of inventory.items) {
          compareAtMap.set(item._id, item.compareAtPrice ?? item.price);
        }

        let totalSaved = 0;
        for (const order of allOrders) {
          for (const item of order.items) {
            const compareAt = compareAtMap.get(item.itemId) ?? item.price;
            totalSaved += Math.max(compareAt - item.price, 0) * item.quantity;
          }
        }

        setSavingsLkr(Number(totalSaved.toFixed(2)));
      } catch {
        setSavingsLkr(0);
      }
    };

    loadSavings();
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    const currentEmail = user.email ?? "";
    const currentPhone = user.phone ?? "";
    return email.trim() !== currentEmail || phone.trim() !== currentPhone;
  }, [email, phone, user]);

  const joinedDate = useMemo(() => {
    if (!user?.createdAt) return "-";
    return new Date(user.createdAt).toLocaleString();
  }, [user?.createdAt]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !hasChanges) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload: { email?: string; phone?: string } = {};
      if (email.trim() !== user.email) payload.email = email.trim();
      if (phone.trim() !== (user.phone ?? "")) payload.phone = phone.trim();

      await updateMe(payload);
      setMessage("Your profile has been updated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update account.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") {
      setError('Type DELETE in the confirmation box to proceed.');
      return;
    }

    const confirmed = globalThis.confirm(
      "This will permanently delete your account. This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await deleteMe();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete account.";
      setError(msg);
      setDeleting(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Account Management</h1>
          <p className={styles.subtitle}>
            View and manage your profile details securely.
          </p>
        </div>
      </section>

      {message ? <div className={`alert alert-success ${styles.alert}`}>{message}</div> : null}
      {error ? <div className={`alert alert-error ${styles.alert}`}>{error}</div> : null}

      <section className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2><UserRound size={18} /> Profile Details</h2>
            <span className="badge badge-blue">{user?.role ?? "customer"}</span>
          </div>

          <form onSubmit={handleSave} className={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">Phone</label>
              <input
                id="profile-phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className={styles.metaRows}>
              <div className={styles.metaRow}>
                <span>Joined</span>
                <strong>{joinedDate}</strong>
              </div>
              <div className={styles.metaRow}>
                <span>User ID</span>
                <strong>{user?._id ?? "-"}</strong>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={!hasChanges || saving}>
                <Save size={15} />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Savings Tracker</h2>
            <span className="badge badge-green">Live</span>
          </div>
          <div className={styles.savingsBlock}>
            <p>You saved</p>
            <h3>Rs. {savingsLkr.toFixed(2)}</h3>
            <small>Compared to regular compare-at prices in your historical purchases.</small>
          </div>
        </article>

        <article className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.cardHead}>
            <h2><ShieldAlert size={18} /> Danger Zone</h2>
          </div>

          <p className={styles.dangerText}>
            Deleting your account is permanent. Your access tokens will be revoked and your profile data will be removed.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="delete-confirm">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="delete-confirm"
              className="form-input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? <AlertTriangle size={15} /> : <Trash2 size={15} />}
            <span>{deleting ? "Deleting..." : "Delete My Account"}</span>
          </button>
        </article>
      </section>
    </div>
  );
}
