import { z } from "zod";

export const createNotificationSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    type: z.enum([
        "inventory_added",
        "inventory_updated",
        "inventory_deleted",
        "order_placed",
        "order_accepted",
        "order_rejected",
        "payment_completed",
        "payment_failed",
        "cart_item_added",
    ]),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    role: z.enum(["admin", "customer"]),
    sendEmail: z.boolean().optional().default(false),
    emailTo: z.string().email().optional(),
    phoneNumber: z.string().min(10).max(15).optional(),
});

export const queryNotificationsSchema = z.object({
    role: z.enum(["admin", "customer"]).optional(),
    type: z
        .enum([
            "inventory_added",
            "inventory_updated",
            "inventory_deleted",
            "order_placed",
            "order_accepted",
            "order_rejected",
            "payment_completed",
            "payment_failed",
            "cart_item_added",
        ])
        .optional(),
    read: z
        .string()
        .transform((v) => v === "true")
        .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const analyticsQuerySchema = z.object({
    year: z.coerce.number().int().min(2020).max(2100),
    role: z.enum(["admin", "customer"]).optional(),
});
