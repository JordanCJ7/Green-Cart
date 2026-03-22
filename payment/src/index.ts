import "dotenv/config";
import mongoose from "mongoose";
import { initializeEnv } from "./config/env.js";
import { createApp } from "./app.js";

// Set up error handlers BEFORE anything else
process.on("unhandledRejection", (reason) => {
    console.error("[ERROR] Unhandled rejection:", reason);
    if (reason instanceof Error) {
        console.error(reason.stack);
    }
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    console.error("[ERROR] Uncaught exception:", error.message);
    console.error(error.stack);
    process.exit(1);
});

const startServer = async (): Promise<void> => {
    try {
        console.log("[STARTUP] Initializing payment service...");
        
        // Step 1: Initialize environment variables
        console.log("[STARTUP] Loading environment variables...");
        const env = initializeEnv();
        console.log("[STARTUP] ✓ Environment loaded successfully");
        console.log(`[STARTUP] Node Environment: ${env.NODE_ENV}`);
        console.log(`[STARTUP] Port: ${env.PORT}`);
        
        // Step 2: Connect to MongoDB
        console.log("[STARTUP] Connecting to MongoDB...");
        await mongoose.connect(env.MONGODB_URI);
        console.log("[STARTUP] ✓ Connected to MongoDB");

        // Step 3: Create Express app
        console.log("[STARTUP] Creating Express app...");
        const app = createApp();
        console.log("[STARTUP] ✓ Express app created");
        
        // Step 4: Start listening
        console.log("[STARTUP] Starting server...");
        const server = app.listen(env.PORT, () => {
            console.log(`[STARTUP] ✓ Server listening on port ${env.PORT}`);
            console.log(`Payment service ready [${env.NODE_ENV}]`);
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
        console.error("[ERROR] Failed to start payment service:");
        if (err instanceof Error) {
            console.error("[ERROR] Message:", err.message);
            console.error("[ERROR] Stack:", err.stack);
        } else {
            console.error("[ERROR] Unknown error:", err);
        }
        process.exit(1);
    }
};

await startServer();
