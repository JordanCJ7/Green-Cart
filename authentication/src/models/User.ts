import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    refreshTokenHash: string | null;
    role: "customer" | "admin";
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        refreshTokenHash: {
            type: String,
            default: null
        },
        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer"
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete ret.passwordHash;
                delete ret.refreshTokenHash;
                delete ret.__v;
                delete ret.id;
                return ret;
            }
        }
    }
);

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
