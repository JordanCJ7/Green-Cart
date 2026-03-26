import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipientId: string;
  type: "order" | "payment" | "shipment" | "promotion" | "system";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["order", "payment", "shipment", "promotion", "system"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 255,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
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
  }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
