import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll } from "vitest";

// Set required env vars at module top-level to ensure they're available
// when env.ts is imported by other modules during test initialization
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_secret_min_16_chars_long";
process.env.PAYHERE_MERCHANT_ID = "test_merchant";
process.env.PAYHERE_SECRET_KEY = "test_secret";
process.env.PAYHERE_WEBHOOK_SECRET = "test_webhook_secret";

let mongoServer: MongoMemoryServer | undefined;

beforeAll(async () => {

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
});

afterAll(async () => {
    if (mongoServer) {
        await mongoServer.stop();
    }
});
