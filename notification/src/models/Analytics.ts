import mongoose, { Schema, Document } from "mongoose";

export interface IMonthlyData {
    month: string;
    revenue: number;
    cost: number;
    profit: number;
}

export interface IAnalytics extends Document {
    year: number;
    role: "admin" | "customer";
    userId?: string;
    monthly: IMonthlyData[];
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    createdAt: Date;
    updatedAt: Date;
}

const monthlyDataSchema = new Schema<IMonthlyData>(
    {
        month: { type: String, required: true },
        revenue: { type: Number, required: true, default: 0 },
        cost: { type: Number, required: true, default: 0 },
        profit: { type: Number, required: true, default: 0 },
    },
    { _id: false }
);

const analyticsSchema = new Schema<IAnalytics>(
    {
        year: { type: Number, required: true, index: true },
        role: { type: String, required: true, enum: ["admin", "customer"] },
        userId: { type: String, sparse: true },
        monthly: { type: [monthlyDataSchema], default: [] },
        totalRevenue: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
        totalProfit: { type: Number, default: 0 },
    },
    { timestamps: true }
);

analyticsSchema.index({ year: 1, role: 1, userId: 1 }, { unique: true });

export const AnalyticsModel = mongoose.model<IAnalytics>("Analytics", analyticsSchema);
