import { Notification, INotification } from "../models/Notification.js";
import { AppError } from "../errors/AppError.js";

interface CreateNotificationInput {
  recipientId: string;
  type: "order" | "payment" | "shipment" | "promotion" | "system";
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
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
    recipientId: string,
    limit = 20,
    skip = 0
  ): Promise<INotification[]> {
    return Notification.find({ recipientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
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

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<INotification> {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
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
  async deleteNotification(notificationId: string): Promise<void> {
    const result = await Notification.findByIdAndDelete(notificationId);

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
