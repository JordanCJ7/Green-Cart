import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.errorCode,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.errors,
    });
    return;
  }

  if (error instanceof Error) {
    console.error("Unhandled error:", error);
    res.status(500).json({
      error: error.message,
      code: "INTERNAL_ERROR",
    });
    return;
  }

  res.status(500).json({
    error: "Unknown error occurred",
    code: "INTERNAL_ERROR",
  });
}
