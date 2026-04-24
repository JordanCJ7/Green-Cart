import mongoose, { Document, Schema } from "mongoose";

export type NotificationType = "inventory" | "user" | "payment";

export interface INotification extends Document {
  userId?: string | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Optional extras (kept for internal publishing + future UX)
  title?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["inventory", "user", "payment"],
      required: true,
    },
    title: {
      type: String,
      default: null,
      maxlength: 255,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
