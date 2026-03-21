import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

export interface AuthPayload {
    sub: string;
    role: "customer" | "admin";
    iat?: number;
    exp?: number;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new AppError("Missing or malformed Authorization header.", 401, "UNAUTHORIZED"));
    }

    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
        req.user = payload;
        next();
    } catch {
        next(new AppError("Invalid or expired access token.", 401, "TOKEN_INVALID"));
    }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
        return next(new AppError("Authentication required.", 401, "UNAUTHORIZED"));
    }

    if (req.user.role !== "admin") {
        return next(new AppError("Admin access required.", 403, "FORBIDDEN"));
    }

    next();
}
