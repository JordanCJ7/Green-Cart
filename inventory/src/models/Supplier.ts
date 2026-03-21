import mongoose, { Document, Schema } from "mongoose";

export interface ISupplier extends Document {
    name: string;
    contact: string;
    phone: string;
    status: "Active" | "Inactive" | "Under Review";
    reliability: number; // 0-100
    lastDelivery?: Date;
    categories: string[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
    {
        name: { type: String, required: true, trim: true, maxlength: 200 },
        contact: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: ["Active", "Inactive", "Under Review"],
            default: "Under Review"
        },
        reliability: { type: Number, min: 0, max: 100, default: 0 },
        lastDelivery: { type: Date },
        categories: { type: [String], default: [] },
        notes: { type: String, maxlength: 1000 }
    },
    { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>("Supplier", SupplierSchema);
