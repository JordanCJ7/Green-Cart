"use client";

import React from "react";
import { BaseLayout, type NavItem } from "@/app/components/BaseLayout";
import styles from "./admin.module.css";

const NAV_ITEMS: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/products", label: "Products", icon: "🥬" },
    { href: "/admin/orders", label: "Orders", icon: "📦" },
    { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
    { href: "/admin/analytics", label: "Analytics", icon: "📈" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

interface AdminLayoutProps {
  readonly children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <BaseLayout
            navItems={NAV_ITEMS}
            roleRequired="admin"
            styleModule={styles}
            showAdminBadge={true}
        >
            {children}
        </BaseLayout>
    );
}
