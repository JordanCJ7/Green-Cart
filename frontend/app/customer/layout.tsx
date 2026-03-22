"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BaseLayout, type NavItem } from "@/app/components/BaseLayout";
import { CreditCard, Heart, LayoutDashboard, UserCircle } from "lucide-react";
import styles from "./customer.module.css";

const NAV_ITEMS: NavItem[] = [
    { href: "/customer/dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
    { href: "/customer/payments", label: "Payments", icon: <CreditCard size={15} /> },
    { href: "/customer/wishlist", label: "Wishlist", icon: <Heart size={15} /> },
    { href: "/customer/profile", label: "Profile", icon: <UserCircle size={15} /> },
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
