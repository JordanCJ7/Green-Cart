import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// General API rate limiter - relaxed but prevents abuse
export const authApiRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests from this IP. Please try again later.",
        code: "RATE_LIMITED"
    },
    skip: (req) => req.method === "OPTIONS"
});

// Registration attempts - stricter to prevent account enumeration
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

// Login attempts - tracks by IP + email combination, allows more attempts but over longer window
export const loginAttemptRateLimiter = rateLimit({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    max: env.LOGIN_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        // Extract email from request body if available
        const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
        // Use combination of IP and email for better tracking
        return email && email.length > 0 ? `login:${req.ip}:${email}` : `login:${req.ip}`;
    },
    message: {
        error: "Too many login attempts. Please try again later.",
        code: "LOGIN_RATE_LIMITED"
    },
    skip: (req) => req.method === "OPTIONS"
});
