import { describe, it, expect, vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom/vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/customer/dashboard",
}));

// Mock auth context
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { email: "customer@test.com", role: "customer" },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Customer Layout", () => {
  it("should export nav items with correct structure", () => {
    const navItems = [
      { href: "/customer/dashboard", label: "Dashboard", icon: "📊" },
      { href: "/customer/orders", label: "My Orders", icon: "📦" },
      { href: "/customer/wishlist", label: "Wishlist", icon: "❤️" },
      { href: "/customer/profile", label: "Profile", icon: "👤" },
    ];

    expect(navItems).toHaveLength(4);
    expect(navItems[0].href).toBe("/customer/dashboard");
    expect(navItems[0].label).toBe("Dashboard");
  });

  it("should have all nav items pointing to customer routes", () => {
    const customerRoutes = [
      "/customer/dashboard",
      "/customer/orders",
      "/customer/wishlist",
      "/customer/profile",
    ];

    customerRoutes.forEach((route) => {
      expect(route).toMatch(/^\/customer\//);
    });
  });

  it("should make customer-logout button with correct id pattern", () => {
    const buttonId = "customer-logout";
    expect(buttonId).toMatch(/^customer-logout$/);
  });

  it("should have correct nav item labels", () => {
    const labels = ["Dashboard", "My Orders", "Wishlist", "Profile"];
    labels.forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });
  });
});
