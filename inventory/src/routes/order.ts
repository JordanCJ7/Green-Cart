import { Router } from "express";
import { orderController } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * POST /orders
 * Create order from cart
 */
router.post("/", orderController.createOrder.bind(orderController));

/**
 * GET /orders
 * Get customer's orders
 */
router.get("/", orderController.getOrders.bind(orderController));

/**
 * GET /orders/:orderId
 * Get specific order
 */
router.get("/:orderId", orderController.getOrder.bind(orderController));

/**
 * PATCH /orders/:orderId/status
 * Update order status
 */
router.patch("/:orderId/status", orderController.updateOrderStatus.bind(orderController));

export default router;
