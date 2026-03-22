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

    if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
    ) {
        res.status(409).json({ error: "Duplicate entry. SKU or unique field already exists." });
        return;
    }

    console.error("[Unhandled Error]", err);
    res.status(500).json({ error: "Internal server error." });
}
