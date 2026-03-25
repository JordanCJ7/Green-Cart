import { app, connectDB } from "./app.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`✓ Notification service running on port ${env.PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Health check: http://localhost:${env.PORT}/health`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start notification service:", error);
    process.exit(1);
  }
}

main();
