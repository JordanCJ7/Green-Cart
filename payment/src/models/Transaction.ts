import mongoose, { Document, Schema } from "mongoose";
import { randomUUID } from "node:crypto";

export interface TransactionDoc extends Document {
    transactionId: string;
    orderId: string;
    customerId: string;
    amount: number;
    currency: string;
    status: "pending" | "completed" | "failed" | "cancelled" | "expired";
    payHereId?: string;
    payHereStatus?: string;
    errorMessage?: string;
    returnUrl: string;
    idempotencyKey?: string;
    orderSnapshot?: {
        items?: Array<{ name: string; quantity: number; price: number }>;
    };
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

const transactionSchema = new Schema<TransactionDoc>(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            default: () => `txn_${randomUUID()}`,
        },
        orderId: {
            type: String,
            required: true,
            index: true,
        },
        customerId: {
            type: String,
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,  // Supports fractional amounts (e.g., 0.50 major units or 50 cents)
        },
        currency: {
            type: String,
            required: true,
            default: "USD",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "cancelled", "expired"],
            default: "pending",
            index: true,
        },
        payHereId: {
            type: String,
            index: true,
            sparse: true,
        },
        payHereStatus: String,
        errorMessage: String,
        returnUrl: {
            type: String,
            required: true,
        },
        idempotencyKey: {
            type: String,
            sparse: true,
            unique: true,
        },
        orderSnapshot: {
            items: [
                {
                    name: String,
                    quantity: Number,
                    price: Number,
                },
            ],
        },
        completedAt: Date,
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                ret._id = `txn_${ret._id}`;
                return ret;
            },
        },
    }
);

export const Transaction = mongoose.model<TransactionDoc>("Transaction", transactionSchema);
