import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(8084),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    SMTP_HOST: z.string().default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    SMTP_FROM: z.string().default("noreply@greencart.com"),
    TWILIO_ACCOUNT_SID: z.string().default(""),
    TWILIO_AUTH_TOKEN: z.string().default(""),
    TWILIO_PHONE_NUMBER: z.string().default(""),
    AUTH_SERVICE_URL: z.string().default("http://localhost:8081"),
    INTERNAL_API_KEY: z.string().default(""),
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
