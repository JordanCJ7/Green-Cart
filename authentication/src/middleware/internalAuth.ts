import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

/**
 * Middleware for service-to-service authentication using a shared API key.
 * Used by the notification service to fetch user details.
 */
export function internalAuth(req: Request, _res: Response, next: NextFunction): void {
    const apiKey = req.headers["x-internal-api-key"];

    if (!env.INTERNAL_API_KEY) {
        return next(new AppError("Internal API key not configured.", 500, "CONFIG_ERROR"));
    }

    if (!apiKey || apiKey !== env.INTERNAL_API_KEY) {
        return next(new AppError("Invalid or missing internal API key.", 403, "FORBIDDEN"));
    }

    next();
}
