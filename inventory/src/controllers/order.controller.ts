import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service.js";
import { AppError } from "../errors/AppError.js";
import { AuthPayload } from "../middleware/authenticate.js";

export class OrderController {
    /**
     * POST /orders
     * Create order from cart
     */
    async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const order = await orderService.createOrderFromCart(user.sub);

            res.status(201).json(order);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /orders
     * Get customer's orders
     */
    async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const limit = Math.min(Number(req.query.limit) || 20, 100);
            const offset = Number(req.query.offset) || 0;

            if (offset < 0) {
                return next(new AppError("Offset cannot be negative", 400, "INVALID_OFFSET"));
            }

            const { orders, total } = await orderService.getCustomerOrders(user.sub, limit, offset);

            res.status(200).json({
                orders,
                total,
                limit,
                offset
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /orders/:orderId
     * Get specific order
     */
    async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const { orderId } = req.params;

            const order = await orderService.getOrder(orderId, user.sub);

            res.status(200).json(order);
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /orders/:orderId/status
     * Update order status (admin only)
     */
    async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const { orderId } = req.params;
            const { status } = req.body;

            if (!status || !["pending", "paid", "failed", "cancelled", "shipped", "delivered"].includes(status)) {
                return next(new AppError("Invalid status value", 400, "INVALID_STATUS"));
            }

            const order = await orderService.updateOrderStatus(orderId, user.sub, status);

            res.status(200).json(order);
        } catch (err) {
            next(err);
        }
    }
}

export const orderController = new OrderController();
