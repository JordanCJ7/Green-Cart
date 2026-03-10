"use client";

import React from "react";
import { BaseLayout, type NavItem } from "@/app/components/BaseLayout";
import styles from "./customer.module.css";

const NAV_ITEMS: NavItem[] = [
    { href: "/customer/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/customer/orders", label: "My Orders", icon: "📦" },
    { href: "/customer/wishlist", label: "Wishlist", icon: "❤️" },
    { href: "/customer/profile", label: "Profile", icon: "👤" },
];

interface CustomerLayoutProps {
  readonly children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
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
