"use client";

import React from "react";
import { BaseLayout, type NavItem } from "@/app/components/BaseLayout";
import { Boxes, LayoutDashboard, Package, Settings, Users } from "lucide-react";
import styles from "./admin.module.css";

const NAV_ITEMS: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
    { href: "/admin/users", label: "Users", icon: <Users size={15} /> },
    { href: "/admin/products", label: "Products", icon: <Boxes size={15} /> },
    { href: "/admin/orders", label: "Orders", icon: <Package size={15} /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings size={15} /> },
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
