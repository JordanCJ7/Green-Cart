import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("GET /health", () => {
    it("returns 200 with status ok", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ status: "ok", service: "authentication" });
    });
});

describe("404 handler", () => {
    it("returns 404 for unknown routes", async () => {
        const res = await request(app).get("/does-not-exist");
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("error");
    });
});
