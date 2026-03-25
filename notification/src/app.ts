import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import notificationRoutes from "./routes/notification.js";

export const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification" });
});

// Routes
app.use("/notifications", notificationRoutes);

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
