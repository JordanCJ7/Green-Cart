import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5005),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().url().default("mongodb://localhost:27017/green-cart"),
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

export const env = envSchema.parse(process.env);
