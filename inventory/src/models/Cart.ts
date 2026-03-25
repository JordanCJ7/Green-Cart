import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    sku: string;
    image?: string;
}

export interface ICart extends Document {
    customerId: string;
    items: ICartItem[];
    totalItems: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
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
        sku: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            type: String,
            default: ""
        }
    },
    { _id: false }
);

const CartSchema = new Schema<ICart>(
    {
        customerId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        items: {
            type: [CartItemSchema],
            default: []
        },
        totalItems: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
