import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType = "in" | "out" | "adjustment";

export interface ITransaction extends Document {
    item: mongoose.Types.ObjectId;
    type: TransactionType;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason?: string;
    reference?: string;
    performedBy?: string;
    notes?: string;
    createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        item: {
            type: Schema.Types.ObjectId,
            ref: "InventoryItem",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ["in", "out", "adjustment"],
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        previousStock: {
            type: Number,
            required: true
        },
        newStock: {
            type: Number,
            required: true
        },
        reason: {
            type: String,
            trim: true
        },
        reference: {
            type: String,
            trim: true,
            index: true
        },
        performedBy: {
            type: String,
            index: true
        },
        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
            transform(_doc, ret) {
                delete ret.__v;
                return ret;
            }
        }
    }
);

TransactionSchema.index({ item: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>("Transaction", TransactionSchema);
