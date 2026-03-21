import "dotenv/config";
import mongoose from "mongoose";
import { env } from "./config/env";
import { createApp } from "./app";

async function main() {
    await mongoose.connect(env.MONGODB_URI, { family: 4 } as any);
    console.log(`✅ Connected to MongoDB`);

    const app = createApp();
    app.listen(env.PORT, () => {
        console.log(`🚀 Inventory service running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
}

main().catch((err: Error) => {
    console.error("❌ Failed to start inventory service:", err);
    process.exit(1);
});
