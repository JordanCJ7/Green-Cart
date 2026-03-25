import { z } from "zod";

export const createNotificationSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  type: z.enum(["order", "payment", "shipment", "promotion", "system"]),
  title: z.string().min(1, "Title is required").max(255),
  message: z.string().min(1, "Message is required"),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateNotificationBody = z.infer<typeof createNotificationSchema>;
