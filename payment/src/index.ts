import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import { createApp } from "./app";

async function main(): Promise<void> {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log(`✅ Connected to MongoDB`);

        const app = createApp();
        app.listen(env.PORT, () => {
            console.log(`🚀 Payment service running on port ${env.PORT} [${env.NODE_ENV}]`);
        });
    } catch (err) {
        console.error("❌ Failed to start payment service:", err);
        process.exit(1);
    }
}

await main();
