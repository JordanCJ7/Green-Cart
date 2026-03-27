import { Notification, INotification } from "../models/Notification.js";
import { AppError } from "../errors/AppError.js";
import { notificationTypeSchema } from "../validation/notificationSchemas.js";

const notificationTypeValues = notificationTypeSchema.options;
type NotificationType = (typeof notificationTypeValues)[number];

interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

interface ListNotificationInput {
  recipientId: string;
  limit: number;
  skip: number;
  read?: boolean;
  type?: NotificationType;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<INotification> {
    const notification = new Notification({
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      metadata: input.metadata || {},
      read: false,
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
    const query: Record<string, unknown> = { recipientId: input.recipientId };
    if (typeof input.read === "boolean") {
      query.read = input.read;
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
      recipientId,
      read: false,
    });
  }

  async getStats(recipientId: string): Promise<NotificationStats> {
    const [total, unread, typeRows] = await Promise.all([
      Notification.countDocuments({ recipientId }),
      Notification.countDocuments({ recipientId, read: false }),
      Notification.aggregate<{ _id: NotificationType; count: number }>([
        { $match: { recipientId } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const byType = notificationTypeValues.reduce<Record<NotificationType, number>>((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<NotificationType, number>);

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
      { _id: notificationId, recipientId },
      { read: true },
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
      { recipientId, read: false },
      { read: true }
    );
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, recipientId: string): Promise<void> {
    const result = await Notification.findOneAndDelete({ _id: notificationId, recipientId });

    if (!result) {
      throw new AppError("Notification not found", 404, "NOT_FOUND");
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearUserNotifications(recipientId: string): Promise<void> {
    await Notification.deleteMany({ recipientId });
  }
}

export const notificationService = new NotificationService();
