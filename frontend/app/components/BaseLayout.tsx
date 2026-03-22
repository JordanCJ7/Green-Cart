"use client";

import React, { useEffect, ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Hand, LogOut, ShoppingBasket } from "lucide-react";

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
  styleModule,
  title,
  showAdminBadge = false,
  showGreeting = false
}: BaseLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  const currentNavLabel = navItems.find((n) => n.href === pathname)?.label ?? title ?? "Dashboard";
  const username = user.email.split("@")[0];

  return (
    <div className={styleModule.shell}>
      <header className={styleModule.sidebar}>
        <div className={styleModule.sidebarHeader}>
          <span className={styleModule.sidebarLogo}><ShoppingBasket size={18} strokeWidth={2.2} /></span>
          <div>
            <span className={styleModule.sidebarBrand}>Green-Cart</span>
            {showAdminBadge && <span className={styleModule.adminBadge}>Admin</span>}
          </div>
        </div>

        <nav className={styleModule.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styleModule.navItem} ${pathname === item.href ? styleModule.navActive : ""}`}
            >
              <span className={styleModule.navIcon} aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styleModule.sidebarFooter}>
          <div className={styleModule.userChip}>
            <div className={styleModule.avatar}>{user.email[0].toUpperCase()}</div>
            <div className={styleModule.userInfo}>
              <p className={styleModule.userName}>{username}</p>
            </div>
          </div>
          <button
            id={`${roleRequired}-logout`}
            className={`btn btn-ghost btn-full ${styleModule.logoutBtn}`}
            onClick={logout}
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <div className={styleModule.main}>
        <header className={styleModule.topbar}>
          <div className={styleModule.topbarLeft}>
            <h2 className={styleModule.pageHeading}>{currentNavLabel}</h2>
          </div>
          <div className={styleModule.topbarRight}>
            {showAdminBadge && <span className={styleModule.adminLabel}>Admin Panel</span>}
            {showGreeting && (
              <span className={styleModule.greeting}>
                <Hand size={14} />
                <span>Hello, {username}</span>
              </span>
            )}
          </div>
        </header>
        <main className={styleModule.content}>{children}</main>
      </div>
    </div>
  );
}
