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

// Helper to ensure authenticated user exists
function getAuthUser(req: Request): string {
  const authUser = req.user;
  if (!authUser) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return authUser.sub;
}

// Helper to get userId (admin can override for other users)
function getRecipientId(req: Request, query?: { userId?: string }): string {
  const authUser = req.user;
  if (!authUser) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return authUser.role === "admin" && query?.userId ? query.userId : authUser.sub;
}

/**
 * POST /notifications
 * Create a new notification
 */
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user!;
      const validated = createNotificationSchema.parse(req.body);
      if (authUser.role !== "admin" && validated.userId && validated.userId !== authUser.sub) {
        throw new AppError("Cannot create notification for another user", 403, "FORBIDDEN");
      }
      const notification = await notificationService.createNotification({
        userId: validated.userId ?? authUser.sub,
        type: validated.type,
        title: validated.title,
        message: validated.message,
        actionUrl: validated.actionUrl,
        metadata: validated.metadata,
      });
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notifications/admin
 * Returns global system notifications (inventory changes + new user registrations)
 */
router.get(
  "/admin",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      if (authUser.role !== "admin") {
        throw new AppError("Admin access required", 403, "FORBIDDEN");
      }

      const query = listNotificationsQuerySchema.parse(req.query);
      const notifications = await notificationService.getAdminNotifications({
        limit: query.limit,
        skip: query.skip,
        read: query.read,
      });
      res.json({ notifications, limit: query.limit, skip: query.skip });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /notifications/user/:userId
 * Returns user-specific notifications
 */
router.get(
  "/user/:userId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      const userId = String(req.params.userId);
      if (authUser.role !== "admin" && userId !== authUser.sub) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }

      const query = listNotificationsQuerySchema.parse(req.query);
      const notifications = await notificationService.getUserNotifications({
        userId,
        limit: query.limit,
        skip: query.skip,
        read: query.read,
        type: query.type,
      });
      const unreadCount = await notificationService.getUnreadCount(userId);
      res.json({ notifications, unreadCount, limit: query.limit, skip: query.skip });
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
      const query = listNotificationsQuerySchema.parse(req.query);
      const recipientId = getRecipientId(req, query as unknown as { userId?: string });
      const notifications = await notificationService.getUserNotifications({
        userId: recipientId,
        limit: query.limit,
        skip: query.skip,
        read: query.read,
        type: query.type,
      });
      const unreadCount = await notificationService.getUnreadCount(recipientId);
      res.json({ notifications, unreadCount, limit: query.limit, skip: query.skip });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/stats",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listNotificationsQuerySchema.parse(req.query);
      const recipientId = getRecipientId(req, query as unknown as { userId?: string });
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
      const recipientId = getAuthUser(req);
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
      const { notificationId } = notificationIdParamsSchema.parse(req.params);
      const authUser = req.user;
      if (!authUser) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const notification = authUser.role === "admin"
        ? await notificationService.markAdminNotificationAsRead(notificationId)
        : await notificationService.markAsRead(notificationId, authUser.sub);
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
      const recipientId = getAuthUser(req);
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
      const recipientId = getAuthUser(req);
      const { notificationId } = notificationIdParamsSchema.parse(req.params);
      await notificationService.deleteNotification(notificationId, recipientId);
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
      const recipientId = getAuthUser(req);
      await notificationService.clearUserNotifications(recipientId);
      res.json({ message: "All notifications cleared" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
