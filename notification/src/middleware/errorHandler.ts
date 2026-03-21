import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            ...(err.code && { code: err.code })
        });
        return;
    }

    // Mongoose duplicate key error
    if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as unknown as { code: number }).code === 11000
    ) {
        res.status(409).json({ error: "Duplicate entry." });
        return;
    }

    console.error("[Unhandled Error]", err);
    res.status(500).json({ error: "Internal server error." });
}
