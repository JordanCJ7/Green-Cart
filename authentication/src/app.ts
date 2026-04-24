import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRouter from "./routes/auth";
import internalRouter from "./routes/internal";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
    const app = express();

    // CORS
    const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
    app.use(
        cors({
            origin: allowedOrigins,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        })
    );

    // Body parsing
    app.use(express.json({ limit: "10kb" }));

    // Health check — no auth required
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok", service: "authentication" });
    });

    // Auth routes
    // - Mounted at root so the API Gateway can strip the /auth prefix and forward /login, /register, ...
    // - Also mounted under /auth for backward compatibility with direct service callers and docs
    app.use("/", authRouter);
    app.use("/auth", authRouter);

    // Internal routes (service-to-service)
    app.use("/internal", internalRouter);

    // 404 fallback
    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found." });
    });

    // Global error handler
    app.use(errorHandler);

    return app;
}
