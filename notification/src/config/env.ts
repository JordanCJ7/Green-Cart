import { z } from "zod";

const rawEnvSchema = z.object({
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
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default("noreply@greencart.com"),
  AUTHENTICATION_SERVICE_URL: z.string().url().optional(),
  AUTH_SERVICE_URL: z.string().url().optional(),
  INVENTORY_SERVICE_URL: z.string().url().default("http://localhost:5002"),
  PAYMENT_SERVICE_URL: z.string().url().default("http://localhost:5004"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

export type Env = Omit<z.infer<typeof rawEnvSchema>, "SMTP_PASS" | "AUTH_SERVICE_URL" | "TWILIO_PHONE_NUMBER"> & {
  SMTP_PASSWORD?: string;
  AUTHENTICATION_SERVICE_URL: string;
  TWILIO_FROM_NUMBER?: string;
};

function parseEnv(): Env {
  const result = rawEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  const authUrl = result.data.AUTHENTICATION_SERVICE_URL ?? result.data.AUTH_SERVICE_URL ?? "http://localhost:8081";
  const smtpPassword = result.data.SMTP_PASSWORD ?? result.data.SMTP_PASS;
  const twilioFrom = result.data.TWILIO_FROM_NUMBER ?? result.data.TWILIO_PHONE_NUMBER;

  return {
    ...result.data,
    AUTHENTICATION_SERVICE_URL: authUrl,
    SMTP_PASSWORD: smtpPassword,
    TWILIO_FROM_NUMBER: twilioFrom,
  };
}

export const env = parseEnv();
