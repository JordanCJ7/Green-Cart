import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import { createApp } from "./app";

async function main() {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB`);

    const app = createApp();
    app.listen(env.PORT, () => {
        console.log(`🚀 Payment service running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
}

main().catch((err: Error) => {
    console.error("❌ Failed to start payment service:", err);
    process.exit(1);
});
