import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
    | "inventory_added"
    | "inventory_updated"
    | "inventory_deleted"
    | "order_placed"
    | "order_accepted"
    | "order_rejected"
    | "payment_completed"
    | "cart_item_added";

export type NotificationRole = "admin" | "customer";

export interface INotification extends Document {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    role: NotificationRole;
    read: boolean;
    emailSent: boolean;
    smsSent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: { type: String, required: true, index: true },
        type: {
            type: String,
            required: true,
            enum: [
                "inventory_added",
                "inventory_updated",
                "inventory_deleted",
                "order_placed",
                "order_accepted",
                "order_rejected",
                "payment_completed",
                "cart_item_added",
            ],
        },
        title: { type: String, required: true, maxlength: 200 },
        message: { type: String, required: true, maxlength: 1000 },
        role: { type: String, required: true, enum: ["admin", "customer"] },
        read: { type: Boolean, default: false },
        emailSent: { type: Boolean, default: false },
        smsSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ role: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const NotificationModel = mongoose.model<INotification>("Notification", notificationSchema);
