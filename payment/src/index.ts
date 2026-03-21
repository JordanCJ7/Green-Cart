import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import { createApp } from "./app";

const startServer = async (): Promise<void> => {
    try {
        console.log("[STARTUP] Initializing payment service...");
        console.log("[STARTUP] Connecting to MongoDB...");
        
        await mongoose.connect(env.MONGODB_URI);
        console.log(`✅ Connected to MongoDB`);

        console.log("[STARTUP] Creating Express app...");
        const app = createApp();
        
        const server = app.listen(env.PORT, () => {
            console.log(`🚀 Payment service running on port ${env.PORT} [${env.NODE_ENV}]`);
            console.log(`📋 Environment: ${env.NODE_ENV}`);
        });

        // Graceful shutdown
        process.on("SIGTERM", () => {
            console.log("[SHUTDOWN] SIGTERM received, closing server...");
            server.close(() => {
                console.log("[SHUTDOWN] Server closed");
                process.exit(0);
            });
        });
    } catch (err) {
        console.error("❌ Failed to start payment service:");
        console.error(err instanceof Error ? err.message : err);
        console.error(err);
        process.exit(1);
    }
};

// Handle top-level errors
process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled rejection:", reason);
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught exception:", error);
    process.exit(1);
});

await startServer();
