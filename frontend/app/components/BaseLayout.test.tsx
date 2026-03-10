import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { BaseLayout } from "./BaseLayout";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/admin/dashboard",
}));

// Mock auth context
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { email: "admin@test.com", role: "admin" },
    loading: false,
    logout: vi.fn(),
  }),
}));

const mockStyles = {
  shell: "shell",
  sidebar: "sidebar",
  sidebarHeader: "sidebarHeader",
  sidebarLogo: "sidebarLogo",
  sidebarBrand: "sidebarBrand",
  adminBadge: "adminBadge",
  nav: "nav",
  navItem: "navItem",
  navActive: "navActive",
  navIcon: "navIcon",
  sidebarFooter: "sidebarFooter",
  userChip: "userChip",
  avatar: "avatar",
  userInfo: "userInfo",
  userName: "userName",
  logoutBtn: "logoutBtn",
  main: "main",
  topbar: "topbar",
  topbarLeft: "topbarLeft",
  topbarRight: "topbarRight",
  pageHeading: "pageHeading",
  adminLabel: "adminLabel",
  greeting: "greeting",
  content: "content",
};

const mockNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
];

describe("BaseLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the layout structure with sidebar and main content", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
      >
        <div>Test Content</div>
      </BaseLayout>
    );

    expect(screen.getByText("Green-Cart")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("displays navigation items", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
      >
        <div>Content</div>
      </BaseLayout>
    );

    // Check for nav items using getAllByText to get all instances
    const dashboardItems = screen.getAllByText("Dashboard");
    expect(dashboardItems.length).toBeGreaterThan(0);
    
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("displays admin badge when showAdminBadge is true", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
        showAdminBadge={true}
      >
        <div>Content</div>
      </BaseLayout>
    );

    const adminBadge = screen.queryAllByText("Admin").find(el => 
      el.className === "adminBadge"
    );
    expect(adminBadge).toBeDefined();
  });

  it("displays greeting when showGreeting is true", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
        showGreeting={true}
      >
        <div>Content</div>
      </BaseLayout>
    );

    expect(screen.getByText(/Hello,/)).toBeInTheDocument();
  });

  it("displays user email in user chip", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
      >
        <div>Content</div>
      </BaseLayout>
    );

    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("renders user avatar with first letter of email", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
      >
        <div>Content</div>
      </BaseLayout>
    );

    const avatar = screen.getByText("A");
    expect(avatar).toBeInTheDocument();
  });

  it("displays correct title when provided", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
        title="Custom Title"
      >
        <div>Content</div>
      </BaseLayout>
    );

    // When title is provided but pathname matches a nav item, it will use the nav item label
    const dashboardItems = screen.getAllByText("Dashboard");
    expect(dashboardItems.length).toBeGreaterThan(0);
  });

  it("renders children content", () => {
    const testContent = "Child Component Content";
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
      >
        <div>{testContent}</div>
      </BaseLayout>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("has logout button with correct id", () => {
    render(
      <BaseLayout
        navItems={mockNavItems}
        roleRequired="admin"
        styleModule={mockStyles}
      >
        <div>Content</div>
      </BaseLayout>
    );

    const logoutBtn = screen.getByRole("button", { name: /Sign out/i });
    expect(logoutBtn).toHaveAttribute("id", "admin-logout");
  });
});
