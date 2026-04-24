import { Notification, INotification, NotificationType } from "../models/Notification.js";
import { AppError } from "../errors/AppError.js";
import { notificationTypeSchema } from "../validation/notificationSchemas.js";

const notificationTypeValues = notificationTypeSchema.options;
type NotificationTypeFromSchema = (typeof notificationTypeValues)[number];

interface CreateNotificationInput {
  userId?: string | null;
  type: NotificationTypeFromSchema;
  message: string;
  title?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

interface ListNotificationInput {
  userId: string;
  limit: number;
  skip: number;
  read?: boolean;
  type?: NotificationTypeFromSchema;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationTypeFromSchema, number>;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<INotification> {
    const notification = new Notification({
      userId: input.userId ?? null,
      type: input.type as NotificationType,
      title: input.title ?? null,
      message: input.message,
      actionUrl: input.actionUrl,
      metadata: input.metadata || {},
      isRead: false,
    });

    await notification.save();
    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    input: ListNotificationInput
  ): Promise<INotification[]> {
    const query: Record<string, unknown> = { userId: input.userId };
    if (typeof input.read === "boolean") {
      query.isRead = input.read;
    }
    if (input.type) {
      query.type = input.type;
    }

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(input.limit)
      .skip(input.skip)
      .exec();
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    return Notification.countDocuments({
      userId: recipientId,
      isRead: false,
    });
  }

  async getAdminNotifications(params: { limit: number; skip: number; read?: boolean }): Promise<INotification[]> {
    const query: Record<string, unknown> = {
      userId: null,
      type: { $in: ["inventory", "user"] },
    };
    if (typeof params.read === "boolean") {
      query.isRead = params.read;
    }

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(params.limit)
      .skip(params.skip)
      .exec();
  }

  async getStats(recipientId: string): Promise<NotificationStats> {
    const [total, unread, typeRows] = await Promise.all([
      Notification.countDocuments({ userId: recipientId }),
      Notification.countDocuments({ userId: recipientId, isRead: false }),
      Notification.aggregate<{ _id: NotificationTypeFromSchema; count: number }>([
        { $match: { userId: recipientId } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const byType = notificationTypeValues.reduce<Record<NotificationTypeFromSchema, number>>((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<NotificationTypeFromSchema, number>);

    for (const row of typeRows) {
      byType[row._id] = row.count;
    }

    return { total, unread, byType };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, recipientId: string): Promise<INotification> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: recipientId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError("Notification not found", 404, "NOT_FOUND");
    }

    return notification;
  }

  /**
   * Mark all notifications for user as read
   */
  async markAllAsRead(recipientId: string): Promise<void> {
    await Notification.updateMany(
      { userId: recipientId, isRead: false },
      { isRead: true }
    );
  }

  async markAdminNotificationAsRead(notificationId: string): Promise<INotification> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: null },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError("Notification not found", 404, "NOT_FOUND");
    }

    return notification;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, recipientId: string): Promise<void> {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId: recipientId });

    if (!result) {
      throw new AppError("Notification not found", 404, "NOT_FOUND");
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearUserNotifications(recipientId: string): Promise<void> {
    await Notification.deleteMany({ userId: recipientId });
  }
}

export const notificationService = new NotificationService();
