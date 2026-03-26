import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "node:crypto";

export interface IOrderItem {
    itemId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface IOrder extends Document {
    orderId: string;
    customerId: string;
    items: IOrderItem[];
    totalAmount: number;
    currency: string;
    status: "pending" | "paid" | "failed" | "cancelled" | "shipped" | "delivered";
    transactionId?: string;
    payHereId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    paidAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
    {
        itemId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        sku: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: {
            type: String,
            default: ""
        }
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            default: () => `ORD-${randomUUID()}`
        },
        customerId: {
            type: String,
            required: true,
            index: true
        },
        items: {
            type: [OrderItemSchema],
            required: true,
            validate: {
                validator: (items: IOrderItem[]) => items.length > 0,
                message: "Order must have at least one item"
            }
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            required: true,
            default: "LKR"
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "cancelled", "shipped", "delivered"],
            default: "pending",
            index: true
        },
        transactionId: {
            type: String,
            index: true,
            sparse: true
        },
        payHereId: {
            type: String,
            sparse: true
        },
        notes: {
            type: String,
            max: 1000
        },
        paidAt: {
            type: Date,
            sparse: true
        }
    },
    {
        timestamps: true
    }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
