import express, { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authenticate } from "../middleware/authenticate";
import { paymentRateLimiter } from "../middleware/rateLimiter";

const router: Router = express.Router();

/**
 * POST /payment
 * Initiate a new payment session
 * Required: Bearer JWT token
 */
router.post(
    "/",
    authenticate,
    paymentRateLimiter,
    async (req, res, next) => {
        await paymentController.initiatePayment(req, res, next);
    }
);

/**
 * GET /payment/:transactionId
 * Retrieve payment status
 * Required: Bearer JWT token + ownership
 */
router.get(
    "/:transactionId",
    authenticate,
    async (req, res, next) => {
        await paymentController.getPaymentStatus(req, res, next);
    }
);

/**
 * POST /payment/webhook/payhere
 * Receive and process PayHere callback
 * No authentication required; signature validation is the security layer
 */
router.post(
    "/webhook/payhere",
    async (req, res, next) => {
        await paymentController.handlePayHereCallback(req, res, next);
    }
);

export default router;
