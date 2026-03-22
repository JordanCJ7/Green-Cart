import rateLimit from "express-rate-limit";
import { getEnvOrThrow } from "../config/env.js";

// Factory function to create limiter after env is initialized
export function createPaymentRateLimiter() {
    const env = getEnvOrThrow();
    return rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: "Too many payment requests from this IP. Please try again later.",
            code: "RATE_LIMITED"
        }
    });
}

// Lazy getter - creates limiter on first access
let _limiter: ReturnType<typeof rateLimit> | null = null;

export function getPaymentRateLimiter() {
    if (!_limiter) {
        _limiter = createPaymentRateLimiter();
    }
    return _limiter;
}
