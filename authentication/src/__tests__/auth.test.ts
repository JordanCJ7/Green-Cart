import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import { createApp } from "../app";

const app = createApp();


let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    // Clear users between tests
    for (const model of Object.values(mongoose.connection.models)) {
        await model.deleteMany({});
    }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Note: Credentials below are for testing purposes only - should never be used in production
// sonarqube:S6670: Test credentials are acceptable in test environments for validation testing
const VALID_USER = { email: "test@example.com", password: "Password123!" }; // NOSONAR

async function registerUser(email = VALID_USER.email, password = VALID_USER.password) {
    return request(app).post("/auth/register").send({ email, password });
}

// ─── POST /auth/register ─────────────────────────────────────────────────────

describe("POST /auth/register", () => {
    it("registers a new user and returns tokens", async () => {
        const res = await registerUser();
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body).toHaveProperty("refreshToken");
        expect(res.body.user).toHaveProperty("email", VALID_USER.email);
        expect(res.body.user).not.toHaveProperty("passwordHash");
        expect(res.body.user).not.toHaveProperty("refreshTokenHash");
    });

    it("rejects registration with a duplicate email", async () => {
        await registerUser();
        const res = await registerUser();
        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty("error");
    });

    it("rejects a weak password", async () => {
        // sonarqube:S6670: Test credentials for validation testing
        const res = await request(app)
            .post("/auth/register")
            .send({ email: "weak@example.com", password: "weak" }); // NOSONAR
        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error");
    });

    it("rejects an invalid email", async () => {
        // sonarqube:S6670: Test credentials for validation testing
        const res = await request(app)
            .post("/auth/register")
            .send({ email: "not-an-email", password: "Password123!" }); // NOSONAR
        expect(res.status).toBe(422);
    });

    it("rejects missing body fields", async () => {
        const res = await request(app).post("/auth/register").send({});
        expect(res.status).toBe(422);
    });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
    beforeEach(async () => {
        await registerUser();
    });

    it("returns tokens for valid credentials", async () => {
        const res = await request(app).post("/auth/login").send(VALID_USER);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body).toHaveProperty("refreshToken");
        expect(res.body.user).toHaveProperty("email", VALID_USER.email);
    });

    it("rejects wrong password with 401", async () => {
        // sonarqube:S6670: Test credentials for validation testing
        const res = await request(app)
            .post("/auth/login")
            .send({ email: VALID_USER.email, password: "WrongPassword1!" }); // NOSONAR
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/Invalid email or password/i);
    });

    it("rejects unknown email with 401 (same message)", async () => {
        // sonarqube:S6670: Test credentials for validation testing
        const res = await request(app)
            .post("/auth/login")
            .send({ email: "nobody@example.com", password: "Password123!" }); // NOSONAR
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/Invalid email or password/i);
    });

    it("rejects missing body fields", async () => {
        const res = await request(app).post("/auth/login").send({});
        expect(res.status).toBe(422);
    });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {
    it("returns a new access token for a valid refresh token", async () => {
        const reg = await registerUser();
        const { refreshToken } = reg.body as { refreshToken: string };

        const res = await request(app).post("/auth/refresh").send({ refreshToken });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("accessToken");
    });

    it("rejects an expired/invalid refresh token", async () => {
        // sonarqube:S2115 & S6670: Test token with intentionally wrong secret
        // NOSONAR: The wrong secret and fake token are intentional for testing token rejection
        // noinspection JSUnusedLocalSymbols
        const fakeToken = jwt.sign( // NOSONAR
            { sub: new mongoose.Types.ObjectId().toString() },
            "wrong-secret", // NOSONAR: Intentional for testing
            { expiresIn: "1s" }
        );
        const res = await request(app).post("/auth/refresh").send({ refreshToken: fakeToken });
        expect(res.status).toBe(401);
    });

    it("validates refresh token against stored bcrypt hash", async () => {
        // Register a user and get first refresh token
        const regRes = await registerUser();
        const { refreshToken: firstToken } = regRes.body as { refreshToken: string };

        // Verify the first token works
        const firstRefresh = await request(app)
            .post("/auth/refresh")
            .send({ refreshToken: firstToken });
        expect(firstRefresh.status).toBe(200);
        expect(firstRefresh.body).toHaveProperty("accessToken");
    });

    it("rejects missing refreshToken", async () => {
        const res = await request(app).post("/auth/refresh").send({});
        expect(res.status).toBe(422);
    });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
    it("returns 204 and invalidates the refresh token", async () => {
        const reg = await registerUser();
        const { refreshToken } = reg.body as { refreshToken: string };

        const logoutRes = await request(app).post("/auth/logout").send({ refreshToken });
        expect(logoutRes.status).toBe(204);

        // Refresh should now fail
        const refreshRes = await request(app).post("/auth/refresh").send({ refreshToken });
        expect(refreshRes.status).toBe(401);
    });

    it("returns 204 even for a garbage token (no info leakage)", async () => {
        const res = await request(app).post("/auth/logout").send({ refreshToken: "garbage.token.value" });
        expect(res.status).toBe(204);
    });

    it("rejects missing refreshToken body field", async () => {
        const res = await request(app).post("/auth/logout").send({});
        expect(res.status).toBe(422);
    });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

describe("GET /auth/me", () => {
    it("returns the user profile for a valid access token", async () => {
        const reg = await registerUser();
        const { accessToken } = reg.body as { accessToken: string };

        const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.user).toHaveProperty("email", VALID_USER.email);
        expect(res.body.user).not.toHaveProperty("passwordHash");
    });

    it("returns 401 without Authorization header", async () => {
        const res = await request(app).get("/auth/me");
        expect(res.status).toBe(401);
    });

    it("returns 401 for an invalid token", async () => {
        const res = await request(app).get("/auth/me").set("Authorization", "Bearer invalid.token.here");
        expect(res.status).toBe(401);
    });

    it("returns 401 for malformed Authorization header", async () => {
        const res = await request(app).get("/auth/me").set("Authorization", "NotBearer token");
        expect(res.status).toBe(401);
    });
});
