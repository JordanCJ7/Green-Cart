import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRouter from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
    const app = express();

    // CORS
    const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
    app.use(
        cors({
            origin: allowedOrigins,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    app.use("/auth", authRouter);

    // 404 fallback
    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found." });
    });

    // Global error handler
    app.use(errorHandler);

    return app;
}
