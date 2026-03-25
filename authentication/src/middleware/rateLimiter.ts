import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const authApiRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many authentication requests from this IP. Please try again later.",
        code: "AUTH_RATE_LIMITED"
    },
    skip: (req) => req.method === "OPTIONS"
});

export const registerAttemptRateLimiter = rateLimit({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    max: env.REGISTER_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many registration attempts from this IP. Please try again later.",
        code: "REGISTER_RATE_LIMITED"
    },
    skip: (req) => req.method === "OPTIONS"
});

export const loginAttemptRateLimiter = rateLimit({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    max: env.LOGIN_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
        return email ? `${req.ip}:${email}` : req.ip || "unknown";
    },
    message: {
        error: "Too many login attempts. Please try again later.",
        code: "LOGIN_RATE_LIMITED"
    },
    skip: (req) => req.method === "OPTIONS"
});
