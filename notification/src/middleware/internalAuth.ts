import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";

export function internalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!env.INTERNAL_API_KEY) {
    next(new AppError("Internal API key is not configured.", 503, "INTERNAL_AUTH_DISABLED"));
    return;
  }

  const apiKey = req.headers["x-internal-api-key"];
  if (typeof apiKey !== "string" || apiKey !== env.INTERNAL_API_KEY) {
    next(new AppError("Invalid internal API key.", 401, "INVALID_INTERNAL_API_KEY"));
    return;
  }

  next();
}
