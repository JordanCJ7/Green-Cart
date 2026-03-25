import { Router, Request, Response, NextFunction } from "express";
import { internalAuth } from "../middleware/internalAuth";
import { createAndSendNotification } from "../services/notificationService";
import { z } from "zod";

const router = Router();

/**
 * Schema for internal notification trigger.
 * Used by payment, inventory, and other services to create notifications.
 */
const internalNotificationSchema = z.object({
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
    phoneNumber: z.string().min(10).max(15).optional(),
});

/**
 * POST /internal/notifications
 * Service-to-service endpoint to create notifications.
 * Protected by internal API key (x-internal-api-key header).
 * Auto-sends SMS for order_accepted, order_rejected, payment_completed.
 */
router.post(
    "/notifications",
    internalAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = internalNotificationSchema.parse(req.body);

            const notification = await createAndSendNotification({
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                role: data.role,
                phoneNumber: data.phoneNumber,
            });

            res.status(201).json(notification);
        } catch (err) {
            next(err);
        }
    }
);

export default router;
