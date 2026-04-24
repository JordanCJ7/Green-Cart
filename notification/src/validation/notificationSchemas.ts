import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "inventory",
  "user",
  "payment",
]);

export const createNotificationSchema = z.object({
  userId: z.string().min(1).optional(),
  type: notificationTypeSchema,
  message: z.string().min(1, "Message is required"),
  title: z.string().min(1).max(255).optional(),
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
  userId: z.string().min(1).optional(),
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

export const eventTypeSchema = z.enum([
  "ITEM_CREATED",
  "ITEM_UPDATED",
  "ITEM_DELETED",
  "USER_REGISTERED",
  "PAYMENT_CREATED",
  "PAYMENT_STATUS_CHANGED",
  "PAYMENT_SUCCESS",
  "CART_ITEM_ADDED",
  "CART_ITEM_REMOVED",
]);

export const internalEventSchema = z.object({
  eventType: eventTypeSchema,
  data: z.record(z.unknown()),
});
