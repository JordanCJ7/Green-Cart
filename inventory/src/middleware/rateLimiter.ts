import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// In development, use a very high limit to avoid 429 errors during local testing.
// In production, use the configured limits.
const isDev = env.NODE_ENV === "development";

export const inventoryRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: isDev ? 100_000 : env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev, // Skip rate limiting entirely in development
    message: {
        error: "Too many requests from this IP. Please try again later.",
        code: "RATE_LIMITED"
    }
});
