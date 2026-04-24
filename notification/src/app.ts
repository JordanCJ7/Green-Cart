import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import notificationRoutes from "./routes/notification.js";
import internalNotificationRoutes from "./routes/internal.js";
import internalEventRoutes from "./routes/events.js";
import { notificationRateLimiter } from "./middleware/rateLimiter.js";

export const app = express();

const allowedOrigins = new Set(
  env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests and configured browser origins only.
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
};

// Middleware
app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification" });
});

// Routes
app.use("/notifications", notificationRateLimiter, notificationRoutes);
app.use("/internal/notifications", internalNotificationRoutes);
app.use("/internal/events", internalEventRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling middleware
app.use(errorHandler);

/**
 * Connect to MongoDB
 */
export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  } catch (error) {
    console.error("✗ MongoDB disconnection failed:", error);
  }
}
