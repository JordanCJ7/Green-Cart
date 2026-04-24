"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, Heart, UserCircle2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import styles from "./store-header.module.css";

interface StoreHeaderProps {
  readonly showBackToProducts?: boolean;
  readonly customLinks?: Array<{ href: string; label: string }>;
}

const HIDDEN_HEADER_LINKS = ["/customer/profile", "/customer/wishlist", "/customer/cart", "/customer/payments"];

function buildHeaderLinks(
  customLinks: Array<{ href: string; label: string }>,
  loading: boolean,
  dashboardHref: string,
  role: "admin" | "customer" | undefined
): Array<{ href: string; label: string }> {
  const defaults = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" }
  ];

  if (!loading && role) {
    defaults.push({ href: dashboardHref, label: role === "admin" ? "Admin Dashboard" : "Dashboard" });
  }

  const merged = [...defaults];
  for (const item of customLinks) {
    if (HIDDEN_HEADER_LINKS.includes(item.href)) {
      continue;
    }

    if (!merged.some((m) => m.href === item.href)) {
      merged.push(item);
    }
  }

  return merged;
}

export default function StoreHeader({ showBackToProducts = false, customLinks = [] }: StoreHeaderProps) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const dashboardHref = useMemo(() => {
    if (!user) return "/login";
    return user.role === "admin" ? "/admin/dashboard" : "/customer/dashboard";
  }, [user]);

  const links = useMemo(
    () => buildHeaderLinks(customLinks, loading, dashboardHref, user?.role),
    [customLinks, dashboardHref, loading, user?.role]
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>GreenCart Market</Link>

        <nav className={styles.navDesktop}>
          {showBackToProducts ? <Link href="/products">Back to Products</Link> : null}
          {links.map((item) => (
            <React.Fragment key={item.href}>
              {isAdmin && item.href === "/admin/users" ? <span className={styles.navDivider} aria-hidden="true" /> : null}
              <Link href={item.href} className={pathname === item.href ? styles.active : ""}>
                {item.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        <div className={styles.actionIcons}>
          {!loading && user?.role === "customer" ? (
            <>
              <Link href="/customer/wishlist" aria-label="Wishlist" className={styles.iconBtn}><Heart size={16} /></Link>
              <Link href="/customer/cart" aria-label="Cart" className={styles.iconBtn}><ShoppingCart size={16} /></Link>
            </>
          ) : null}
          {!loading && !user ? (
            <div className={styles.authActions}>
              <Link href="/login" className={styles.signInBtn}>Sign In</Link>
              <Link href="/register" className={styles.navCta}>Create Account</Link>
            </div>
          ) : null}

          {!loading && user ? (
            <div className={styles.accountWrap}>
              <button
                type="button"
                aria-label="Open account menu"
                className={styles.iconBtn}
                onClick={() => setAccountOpen((v) => !v)}
              >
                <UserCircle2 size={16} />
              </button>
              {accountOpen ? (
                <div className={styles.accountMenu}>
                  <Link href={dashboardHref} onClick={() => setAccountOpen(false)}>Dashboard</Link>
                  {user.role === "customer" ? (
                    <Link href="/customer/profile" onClick={() => setAccountOpen(false)}>Profile Management</Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      void logout();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <button type="button" className={styles.menuBtn} onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className={styles.mobileMenu}>
          {links.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {!loading && !user ? (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>Sign In</Link>
              <Link href="/register" onClick={() => setOpen(false)}>Create Account</Link>
            </>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
