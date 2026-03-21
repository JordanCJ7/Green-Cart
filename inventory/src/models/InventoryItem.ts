import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventoryItem extends Document {
    name: string;
    description?: string;
    sku: string;
    category: mongoose.Types.ObjectId;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    stock: number;
    lowStockThreshold: number;
    unit: string;
    weight?: number;
    shelfLife?: number;
    images?: string[];
    certifications?: string[];
    isActive: boolean;
    sellerId?: string;
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
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
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
        costPrice: {
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
        weight: {
            type: Number,
            min: 0
        },
        shelfLife: {
            type: Number,
            min: 0
        },
        images: {
            type: [String],
            default: []
        },
        certifications: {
            type: [String],
            default: []
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        sellerId: {
            type: String,
            index: true
        }
    },
    {
        timestamps: true,
        collection: "inventory",
        toJSON: {
            transform(_doc, ret) {
                delete ret.__v;
                return ret;
            }
        }
    }
);

InventoryItemSchema.index({ name: "text", description: "text" });
InventoryItemSchema.index({ category: 1, isActive: 1 });
InventoryItemSchema.index({ stock: 1, lowStockThreshold: 1 });

export const InventoryItem: Model<IInventoryItem> = mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);
