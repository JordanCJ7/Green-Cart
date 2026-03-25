import mongoose, { Schema, Document } from "mongoose";

export interface IWishlistItem {
    itemId: string;
    name: string;
    price: number;
    sku: string;
    image?: string;
    addedAt: Date;
}

export interface IWishlist extends Document {
    customerId: string;
    items: IWishlistItem[];
    createdAt: Date;
    updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
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
        sku: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            type: String,
            default: ""
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const WishlistSchema = new Schema<IWishlist>(
    {
        customerId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        items: {
            type: [WishlistItemSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

export const Wishlist = mongoose.model<IWishlist>("Wishlist", WishlistSchema);
