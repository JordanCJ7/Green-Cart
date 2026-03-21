"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BaseLayout, type NavItem } from "@/app/components/BaseLayout";
import styles from "./customer.module.css";

const NAV_ITEMS: NavItem[] = [
    { href: "/customer/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/customer/orders", label: "My Orders", icon: "📦" },
    { href: "/customer/notifications", label: "Notifications", icon: "🔔" },
    { href: "/customer/analytics", label: "My Spending", icon: "📈" },
    { href: "/customer/wishlist", label: "Wishlist", icon: "❤️" },
    { href: "/customer/profile", label: "Profile", icon: "👤" },
];

interface CustomerLayoutProps {
  readonly children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const router = useRouter();
    const { user } = useAuth();

    // Redirect admins to admin dashboard; only customers should access this layout
    if (user?.role === "admin") {
        router.push("/admin/dashboard");
        return null;
    }

    return (
        <BaseLayout
            navItems={NAV_ITEMS}
            roleRequired="customer"
            styleModule={styles}
            showGreeting={true}
        >
            {children}
        </BaseLayout>
    );
}
