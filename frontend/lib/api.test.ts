import { describe, expect, it, vi } from "vitest";
import { apiFetch, checkServiceHealth, getServiceBaseUrl } from "./api";

describe("api helpers", () => {
  it("trims and normalizes configured service URL", () => {
    process.env.NEXT_PUBLIC_AUTH_API_URL = "http://localhost:8081/";
    expect(getServiceBaseUrl("authentication")).toBe("http://localhost:8081");
  });

  it("throws when base URL is missing", async () => {
    await expect(apiFetch("notification", "/health")).rejects.toThrow(
      "Missing base URL for notification"
    );
  });

  it("returns false when service health endpoint cannot be reached", async () => {
    const result = await checkServiceHealth("notification");
    expect(result).toBe(false);
  });

  it("returns parsed JSON for successful API responses", async () => {
    process.env.NEXT_PUBLIC_INVENTORY_API_URL = "http://inventory.local";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => "",
      status: 200,
      statusText: "OK"
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ ok: boolean }>("inventory", "/health");
    expect(result.ok).toBe(true);

    vi.unstubAllGlobals();
  });

  it("throws detailed errors for failed API responses", async () => {
    process.env.NEXT_PUBLIC_PAYMENT_API_URL = "http://payment.local";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
      text: async () => "bad request",
      status: 400,
      statusText: "Bad Request"
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("payment", "/checkout")).rejects.toThrow("API payment 400: bad request");

    vi.unstubAllGlobals();
  });

  it("returns true when service health endpoint responds successfully", async () => {
    process.env.NEXT_PUBLIC_AUTH_API_URL = "http://auth.local";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkServiceHealth("authentication");
    expect(result).toBe(true);

    vi.unstubAllGlobals();
  });
});
