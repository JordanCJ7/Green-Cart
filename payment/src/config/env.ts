import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(8083),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    RATE_LIMIT_MAX: z.coerce.number().default(10),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    PAYHERE_MERCHANT_ID: z.string().min(1, "PAYHERE_MERCHANT_ID is required"),
    PAYHERE_SECRET_KEY: z.string().min(1, "PAYHERE_SECRET_KEY is required"),
    PAYHERE_WEBHOOK_SECRET: z.string().min(1, "PAYHERE_WEBHOOK_SECRET is required"),
    PAYHERE_API_URL: z.string().url().default("https://sandbox.payhere.lk"),
    PAYMENT_CALLBACK_URL: z.string().url().default("http://localhost:8083/payment/webhook/payhere"),
    PAYMENT_RETURN_URL: z.string().url().default("http://localhost:3000/checkout/success"),
    PAYMENT_CANCEL_URL: z.string().url().default("http://localhost:3000/checkout/cancel"),
});

function parseEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ Invalid environment variables:");
        console.error(result.error.flatten().fieldErrors);
        process.exit(1);
    }
    return result.data;
}

export const env = parseEnv();

