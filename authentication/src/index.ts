import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import { createApp } from "./app";

async function main() {
    await mongoose.connect(env.MONGODB_URI, { family: 4 } as any);
    console.log(`✅ Connected to MongoDB`);

    const app = createApp();
    app.listen(env.PORT, () => {
        console.log(`🚀 Authentication service running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
}

// sonarqube:S4930 - Promise chain is appropriate for async initialization
// NOSONAR: .catch() pattern is idiomatic for Node.js startup error handling
main().catch((err: Error) => { // NOSONAR: S4930
    // sonarqube:S106: Console is appropriate for non-mocked initialization errors
    console.error("❌ Failed to start authentication service:", err); // NOSONAR
    process.exit(1);
});
