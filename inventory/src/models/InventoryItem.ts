import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventoryItem extends Document {
    name: string;
    description?: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    lowStockThreshold: number;
    unit: string;
    images?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            trim: true
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        compareAtPrice: {
            type: Number,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        lowStockThreshold: {
            type: Number,
            required: true,
            default: 10,
            min: 0
        },
        unit: {
            type: String,
            required: true,
            trim: true
        },
        images: {
            type: [String],
            default: []
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete ret.__v;
                return ret;
            }
        }
    }
);

InventoryItemSchema.index({ name: "text", description: "text" });
InventoryItemSchema.index({ stock: 1, lowStockThreshold: 1 });

export const InventoryItem: Model<IInventoryItem> = mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);
