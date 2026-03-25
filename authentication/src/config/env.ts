import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(8081),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
    JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().default(300),
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(20),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    INTERNAL_API_KEY: z.string().default(""),
});

function parseEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("Invalid environment variables:");
        console.error(result.error.flatten().fieldErrors);
        process.exit(1);
    }
    return result.data;
}

export const env = parseEnv();
