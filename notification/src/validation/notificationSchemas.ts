import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "order",
  "payment",
  "shipment",
  "promotion",
  "system",
]);

export const createNotificationSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  type: notificationTypeSchema,
  title: z.string().min(1, "Title is required").max(255),
  message: z.string().min(1, "Message is required"),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateNotificationBody = z.infer<typeof createNotificationSchema>;

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
  read: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === "true";
    }),
  type: notificationTypeSchema.optional(),
  recipientId: z.string().min(1).optional(),
});

export const notificationIdParamsSchema = z.object({
  notificationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "notificationId must be a valid ObjectId"),
});

export const internalCreateNotificationSchema = createNotificationSchema.extend({
  sendEmail: z.boolean().optional().default(false),
  emailTo: z.string().email().optional(),
}).superRefine((value, ctx) => {
  if (value.sendEmail && !value.emailTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "emailTo is required when sendEmail is true",
      path: ["emailTo"],
    });
  }
});
