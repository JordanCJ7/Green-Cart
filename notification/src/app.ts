import express from "express";
import cors from "cors";
import { env } from "./config/env";
import notificationRouter from "./routes/notification";
import analyticsRouter from "./routes/analytics";
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
        res.status(200).json({ status: "ok", service: "notification" });
    });

    // Routes
    app.use("/notifications", notificationRouter);
    app.use("/analytics", analyticsRouter);

    // Internal service-to-service routes (API key protected)
    app.use("/internal", internalRouter);

    // 404 fallback
    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found." });
    });

    // Global error handler
    app.use(errorHandler);

    return app;
}
