import { Request, Response, NextFunction } from "express";
import { NotificationModel } from "../models/Notification";
import { AppError } from "../errors/AppError";
import { createNotificationSchema, queryNotificationsSchema } from "../validation/notificationSchemas";
import { sendEmail, buildNotificationEmail } from "../services/emailService";
import { sendSms, buildOrderSmsBody, buildPaymentSmsBody } from "../services/smsService";

/** GET /notifications */
export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const query = queryNotificationsSchema.parse(req.query);
        const filter: Record<string, unknown> = {};

        if (query.role) filter.role = query.role;
        if (query.type) filter.type = query.type;
        if (query.read !== undefined) filter.read = query.read;

        // Scope to user unless admin
        if (req.user?.role !== "admin") {
            filter.userId = req.user?.sub;
        }

        const skip = (query.page - 1) * query.limit;
        const [notifications, total] = await Promise.all([
            NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
            NotificationModel.countDocuments(filter),
        ]);

        res.json({ notifications, total, page: query.page, limit: query.limit });
    } catch (err) {
        next(err);
    }
}

/** GET /notifications/stats */
export async function getNotificationStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const role = req.query.role as string | undefined;
        const filter: Record<string, unknown> = {};

        if (role) filter.role = role;
        if (req.user?.role !== "admin") {
            filter.userId = req.user?.sub;
        }

        const [total, unread] = await Promise.all([
            NotificationModel.countDocuments(filter),
            NotificationModel.countDocuments({ ...filter, read: false }),
        ]);

        res.json({ total, unread, read: total - unread });
    } catch (err) {
        next(err);
    }
}

/** POST /notifications */
export async function createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = createNotificationSchema.parse(req.body);

        const notification = await NotificationModel.create({
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            role: data.role,
        });

        // Send email if requested
        if (data.sendEmail && data.emailTo) {
            const html = buildNotificationEmail(data.title, data.message);
            const sent = await sendEmail({ to: data.emailTo, subject: data.title, html });
            if (sent) {
                notification.emailSent = true;
                await notification.save();
            }
        }

        // Auto-send SMS for order accepted/rejected/payment completed/payment failed
        const smsTypes = ["order_accepted", "order_rejected", "payment_completed", "payment_failed"] as const;
        if (smsTypes.includes(data.type as typeof smsTypes[number]) && data.phoneNumber) {
            const body = (data.type === "payment_completed" || data.type === "payment_failed")
                ? buildPaymentSmsBody(data.title, data.message)
                : buildOrderSmsBody(data.title, data.message);
            const sent = await sendSms({ to: data.phoneNumber, body });
            if (sent) {
                notification.smsSent = true;
                await notification.save();
            }
        }

        res.status(201).json(notification);
    } catch (err) {
        next(err);
    }
}

/** PATCH /notifications/:id/read */
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const notification = await NotificationModel.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!notification) {
            return next(new AppError("Notification not found.", 404, "NOT_FOUND"));
        }
        res.json(notification);
    } catch (err) {
        next(err);
    }
}

/** PATCH /notifications/read-all */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const filter: Record<string, unknown> = { read: false };
        const role = req.query.role as string | undefined;
        if (role) filter.role = role;

        if (req.user?.role !== "admin") {
            filter.userId = req.user?.sub;
        }

        const result = await NotificationModel.updateMany(filter, { read: true });
        res.json({ modifiedCount: result.modifiedCount });
    } catch (err) {
        next(err);
    }
}

/** DELETE /notifications/:id */
export async function deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const notification = await NotificationModel.findByIdAndDelete(req.params.id);
        if (!notification) {
            return next(new AppError("Notification not found.", 404, "NOT_FOUND"));
        }
        res.json({ message: "Notification deleted." });
    } catch (err) {
        next(err);
    }
}
