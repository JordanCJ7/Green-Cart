import express from "express";
import cors from "cors";
import { getEnvOrThrow } from "./config/env";
import paymentRouter from "./routes/payment";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
    const app = express();
    const env = getEnvOrThrow();

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
    app.use(express.urlencoded({ extended: false, limit: "10kb" }));

    // Health check — no auth required
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok", service: "payment" });
    });

    // Payment routes
    app.use("/payment", paymentRouter);

    // 404 fallback
    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found." });
    });

    // Global error handler
    app.use(errorHandler);

    return app;
}
