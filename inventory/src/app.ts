import express from "express";
import cors from "cors";
import { env } from "./config/env";
import inventoryRouter from "./routes/inventory";
import categoryRouter from "./routes/category";
import { errorHandler } from "./middleware/errorHandler";
import { inventoryRateLimiter } from "./middleware/rateLimiter";

export function createApp() {
    const app = express();

    const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
    app.use(
        cors({
            origin: allowedOrigins,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        })
    );

    app.use(express.json({ limit: "10kb" }));

    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok", service: "inventory" });
    });

    app.use(inventoryRateLimiter);

    app.use("/inventory", inventoryRouter);
    app.use("/categories", categoryRouter);

    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found." });
    });

    app.use(errorHandler);

    return app;
}
