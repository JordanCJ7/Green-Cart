import { Router, Request, Response, NextFunction } from "express";
import { internalAuth } from "../middleware/internalAuth.js";
import { notificationService } from "../services/notification.service.js";
import { internalCreateNotificationSchema } from "../validation/notificationSchemas.js";
import { sendNotificationEmail } from "../services/email.service.js";

const router = Router();

router.use(internalAuth);

router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = internalCreateNotificationSchema.parse(req.body);

    const notification = await notificationService.createNotification({
      recipientId: payload.recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
      metadata: payload.metadata,
    });

    let emailSent = false;
    if (payload.sendEmail && payload.emailTo) {
      emailSent = await sendNotificationEmail({
        to: payload.emailTo,
        title: payload.title,
        message: payload.message,
        actionUrl: payload.actionUrl,
      });
    }

    res.status(201).json({
      notification,
      channels: {
        inApp: true,
        emailSent,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
