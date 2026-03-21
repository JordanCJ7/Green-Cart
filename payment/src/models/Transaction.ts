import mongoose, { Document, Schema } from "mongoose";

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
            default: () => `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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
            min: 1,
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
