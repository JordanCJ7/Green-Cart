import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import { createApp } from "./app";

try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB`);

    const app = createApp();
    app.listen(env.PORT, () => {
        console.log(`🚀 Inventory service running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
} catch (err: unknown) {
    console.error("❌ Failed to start inventory service:", err);
    process.exit(1);
}
