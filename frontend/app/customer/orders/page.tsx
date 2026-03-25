"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiGetOrders, type OrdersResponse } from "@/lib/order-api";
import { Package, ArrowLeft, Loader2, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: { bg: "#fef3c7", text: "#92400e", icon: <Clock size={16} /> },
  paid: { bg: "#dcfce7", text: "#166534", icon: <CheckCircle2 size={16} /> },
  failed: { bg: "#fee2e2", text: "#991b1b", icon: <AlertCircle size={16} /> },
  cancelled: { bg: "#f3f4f6", text: "#4b5563", icon: <AlertCircle size={16} /> },
  shipped: { bg: "#dbeafe", text: "#0c4a6e", icon: <Package size={16} /> },
  delivered: { bg: "#dcfce7", text: "#166534", icon: <CheckCircle2 size={16} /> },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await apiGetOrders(20, 0);
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, router]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
        <p>Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.orders.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Package size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
        <h2>No orders yet</h2>
        <p style={{ color: "var(--ink-subtle)", marginBottom: "1.5rem" }}>
          Start shopping to place your first order
        </p>
        <Link href="/customer/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} /> Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Package size={28} /> My Orders
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))",
        gap: "1.5rem"
      }}>
        {orders.orders.map(order => {
          const statusConfig = statusColors[order.status] || statusColors.pending;

          return (
            <div
              key={order.orderId}
              style={{
                background: "#fff",
                borderRadius: "8px",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                borderLeft: "4px solid #166534"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-subtle)" }}>Order ID</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>
                    {order.orderId}
                  </p>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    background: statusConfig.bg,
                    color: statusConfig.text,
                    fontSize: "0.9rem",
                    fontWeight: 600
                  }}
                >
                  {statusConfig.icon}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-subtle)", marginBottom: "0.25rem" }}>
                    <Calendar size={14} style={{ display: "inline", marginRight: "0.25rem" }} />
                    Order Date
                  </p>
                  <p style={{ fontWeight: 500 }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-subtle)", marginBottom: "0.25rem" }}>
                    <DollarSign size={14} style={{ display: "inline", marginRight: "0.25rem" }} />
                    Total Amount
                  </p>
                  <p style={{ fontWeight: 700, color: "#166534", fontSize: "1.1rem" }}>
                    Rs. {order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-subtle)", marginBottom: "0.5rem", fontWeight: 600 }}>
                  Items ({order.items.length})
                </p>
                {order.items.map(item => (
                  <div key={item.itemId} style={{ fontSize: "0.9rem", padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6" }}>
                    {item.quantity}x {item.name} - Rs. {(item.price * item.quantity).toFixed(2)}
                  </div>
                ))}
              </div>

              {order.paidAt && (
                <p style={{ fontSize: "0.85rem", color: "var(--ink-subtle)" }}>
                  Paid on {new Date(order.paidAt).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {orders.total > orders.limit && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p style={{ color: "var(--ink-subtle)" }}>
            Showing {orders.orders.length} of {orders.total} orders
          </p>
        </div>
      )}
    </div>
  );
}
