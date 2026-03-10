import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("RootLayout", () => {
  it("should export a default RootLayout component", () => {
    // Since RootLayout is a server component with metadata, we verify
    // its existence and structure by checking the file content
    const layoutPath = path.join(__dirname, "layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    // Verify the layout component exists and has expected exports
    expect(layoutContent).toContain("export const metadata");
    expect(layoutContent).toContain("export default function RootLayout");
    expect(layoutContent).toContain("<html");
    expect(layoutContent).toContain("<body>");
    expect(layoutContent).toContain("AuthProvider");
    expect(layoutContent).toContain("children");
  });
});
