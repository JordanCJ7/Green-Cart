import { Router, Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service.js";
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "../validation/notificationSchemas.js";
import { authenticate } from "../middleware/authenticate.js";
import { AppError } from "../errors/AppError.js";

const router = Router();

router.use(authenticate);

/**
 * POST /notifications
 * Create a new notification
 */
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const validated = createNotificationSchema.parse(req.body);
      if (authUser.role !== "admin" && validated.recipientId !== authUser.sub) {
        throw new AppError("Cannot create notification for another user", 403, "FORBIDDEN");
      }

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
 * GET /notifications
 * Get authenticated user's notifications with pagination
 */
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const query = listNotificationsQuerySchema.parse(req.query);
      const recipientId =
        authUser.role === "admin" && query.recipientId
          ? query.recipientId
          : authUser.sub;

      const notifications = await notificationService.getUserNotifications({
        recipientId,
        limit: query.limit,
        skip: query.skip,
        read: query.read,
        type: query.type,
      });
      const unreadCount = await notificationService.getUnreadCount(recipientId);

      res.json({
        notifications,
        unreadCount,
        limit: query.limit,
        skip: query.skip,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/stats",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const query = listNotificationsQuerySchema.parse(req.query);
      const recipientId =
        authUser.role === "admin" && query.recipientId
          ? query.recipientId
          : authUser.sub;

      const stats = await notificationService.getStats(recipientId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notifications/unread
 * Get unread notification count for authenticated user
 */
router.get(
  "/unread",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      const recipientId = authUser.sub;
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
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      const { notificationId } = notificationIdParamsSchema.parse(req.params);
      const notification = await notificationService.markAsRead(
        notificationId,
        authUser.sub
      );
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read for authenticated user
 */
router.patch(
  "/read-all",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      await notificationService.markAllAsRead(authUser.sub);
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
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      const { notificationId } = notificationIdParamsSchema.parse(req.params);
      await notificationService.deleteNotification(notificationId, authUser.sub);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /notifications/clear
 * Clear all notifications for authenticated user
 */
router.delete(
  "/clear",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      await notificationService.clearUserNotifications(authUser.sub);
      res.json({ message: "All notifications cleared" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
