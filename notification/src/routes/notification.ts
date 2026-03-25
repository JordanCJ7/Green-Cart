import { Router, Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service.js";
import { createNotificationSchema } from "../validation/notificationSchemas.js";

const router = Router();

/**
 * POST /notifications
 * Create a new notification
 */
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createNotificationSchema.parse(req.body);
      const notification = await notificationService.createNotification(
        validated
      );
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notifications/:recipientId
 * Get user notifications with pagination
 */
router.get(
  "/:recipientId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { recipientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = parseInt(req.query.skip as string) || 0;

      const notifications = await notificationService.getUserNotifications(
        recipientId,
        limit,
        skip
      );
      const unreadCount = await notificationService.getUnreadCount(
        recipientId
      );

      res.json({
        notifications,
        unreadCount,
        limit,
        skip,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notifications/:recipientId/unread
 * Get unread notification count
 */
router.get(
  "/:recipientId/unread",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { recipientId } = req.params;
      const count = await notificationService.getUnreadCount(recipientId);
      res.json({ unreadCount: count });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notifications/:notificationId/read
 * Mark notification as read
 */
router.patch(
  "/:notificationId/read",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(
        notificationId
      );
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notifications/:recipientId/read-all
 * Mark all notifications as read for user
 */
router.patch(
  "/:recipientId/read-all",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { recipientId } = req.params;
      await notificationService.markAllAsRead(recipientId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /notifications/:notificationId
 * Delete a notification
 */
router.delete(
  "/:notificationId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notificationId } = req.params;
      await notificationService.deleteNotification(notificationId);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /notifications/:recipientId/clear
 * Clear all notifications for user
 */
router.delete(
  "/:recipientId/clear",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { recipientId } = req.params;
      await notificationService.clearUserNotifications(recipientId);
      res.json({ message: "All notifications cleared" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
