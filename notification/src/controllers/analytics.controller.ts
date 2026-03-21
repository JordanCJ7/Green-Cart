import { Request, Response, NextFunction } from "express";
import { AnalyticsModel } from "../models/Analytics";
import { analyticsQuerySchema } from "../validation/notificationSchemas";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function emptyMonthly() {
    return MONTHS.map((m) => ({ month: m, revenue: 0, cost: 0, profit: 0 }));
}

/** GET /analytics */
export async function getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const query = analyticsQuerySchema.parse(req.query);
        const filter: Record<string, unknown> = { year: query.year };

        if (query.role) filter.role = query.role;
        if (req.user?.role !== "admin") {
            filter.userId = req.user?.sub;
        }

        const analytics = await AnalyticsModel.findOne(filter).lean();

        if (!analytics) {
            const monthly = emptyMonthly();
            res.json({
                totalRevenue: 0,
                totalCost: 0,
                totalProfit: 0,
                monthly,
            });
            return;
        }

        res.json({
            totalRevenue: analytics.totalRevenue,
            totalCost: analytics.totalCost,
            totalProfit: analytics.totalProfit,
            monthly: analytics.monthly,
        });
    } catch (err) {
        next(err);
    }
}
