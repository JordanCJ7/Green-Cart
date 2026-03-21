import rateLimit from "express-rate-limit";
import { getEnvOrThrow } from "../config/env";

const env = getEnvOrThrow();

export const paymentRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many payment requests from this IP. Please try again later.",
        code: "RATE_LIMITED"
    }
});
