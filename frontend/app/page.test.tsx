import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Home from "./page";

// Mock next/link to avoid router issues in tests
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

describe("Home (landing) page", () => {
  it("renders the headline and CTA links", () => {
    render(<Home />);

    expect(screen.getByText(/Groceries that care/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start Shopping Free/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toBeInTheDocument();
  });

  it("renders category cards", () => {
    render(<Home />);
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText("Dairy")).toBeInTheDocument();
  });
});
