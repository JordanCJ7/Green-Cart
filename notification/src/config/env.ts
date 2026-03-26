import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5005),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  INTERNAL_API_KEY: z.string().default(""),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(200),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default("noreply@greencart.com"),
  AUTHENTICATION_SERVICE_URL: z.string().url().default("http://localhost:5001"),
  INVENTORY_SERVICE_URL: z.string().url().default("http://localhost:5002"),
  PAYMENT_SERVICE_URL: z.string().url().default("http://localhost:5004"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
