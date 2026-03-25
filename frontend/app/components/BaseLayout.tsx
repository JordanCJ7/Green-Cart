"use client";

import React, { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import StoreHeader from "./StoreHeader";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export interface BaseLayoutProps {
  readonly children: ReactNode;
  readonly navItems: NavItem[];
  readonly roleRequired: "admin" | "customer";
  readonly styleModule: Record<string, string>;
  readonly title?: string;
  readonly showAdminBadge?: boolean;
  readonly showGreeting?: boolean;
}

export function BaseLayout({
  children,
  navItems,
  roleRequired,
  styleModule
}: BaseLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Client-side guard
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (roleRequired === "admin" && user.role !== "admin") {
        router.push("/customer/dashboard");
      }
    }
  }, [loading, user, router, roleRequired]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-lg" />
      </div>
    );
  }

  if (!user || (roleRequired === "admin" && user.role !== "admin")) {
    return null;
  }

  const headerLinks = navItems.map((item) => ({ href: item.href, label: item.label }));
  if (roleRequired === "admin") {
    const mustHave = [
      { href: "/admin/users", label: "User Management" },
      { href: "/admin/products", label: "Inventory" },
      { href: "/admin/orders", label: "Orders" }
    ];
    for (const item of mustHave) {
      if (!headerLinks.some((link) => link.href === item.href)) {
        headerLinks.push(item);
      }
    }
  }

  return (
    <div className={styleModule.shell}>
      <StoreHeader customLinks={headerLinks} />
      <div className={styleModule.main}>
        <main className={styleModule.content}>{children}</main>
      </div>
    </div>
  );
}
