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
    }
});

export const loginAttemptRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.LOGIN_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        error: "Too many login or registration attempts from this IP. Please try again later.",
        code: "RATE_LIMITED"
    }
});
