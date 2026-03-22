import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service.js";
import { initiatePaymentSchema, payHereWebhookSchema } from "../validation/paymentSchemas.js";
import { AppError } from "../errors/AppError.js";
import { AuthPayload } from "../middleware/authenticate";

export class PaymentController {
    /**
     * POST /payment
     * Initiate a new payment session
     */
    async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;

            // Validate request body
            const validationResult = initiatePaymentSchema.safeParse(req.body);
            if (!validationResult.success) {
                return next(
                    new AppError(
                        `Validation failed: ${validationResult.error.errors
                            .map((e) => `${e.path.join(".")}: ${e.message}`)
                            .join(", ")}`,
                        422,
                        "VALIDATION_ERROR"
                    )
                );
            }

            // Initiate payment
            const result = await paymentService.initiatePayment(validationResult.data, user.sub);

            res.status(201).json({
                transactionId: result.transactionId,
                checkoutUrl: result.checkoutUrl,
                paymentPayload: result.paymentPayload,
                status: result.status,
                createdAt: result.createdAt,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /payment/:transactionId
     * Retrieve payment transaction status
     */
    async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const { transactionId } = req.params;

            const transaction = await paymentService.getPaymentStatus(transactionId, user.sub);

            res.status(200).json({
                transactionId: transaction.transactionId,
                orderId: transaction.orderId,
                customerId: transaction.customerId,
                amount: transaction.amount,
                currency: transaction.currency,
                status: transaction.status,
                payHereId: transaction.payHereId,
                payHereStatus: transaction.payHereStatus,
                errorMessage: transaction.errorMessage,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
                completedAt: transaction.completedAt,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /payment/webhook/payhere
     * Handle PayHere webhook callback
     * Note: No authentication required; signature verification is the security measure
     */
    async handlePayHereCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate webhook payload
            const validationResult = payHereWebhookSchema.safeParse(req.body);
            if (!validationResult.success) {
                return next(
                    new AppError(
                        `Invalid webhook payload: ${validationResult.error.errors
                            .map((e) => `${e.path.join(".")}: ${e.message}`)
                            .join(", ")}`,
                        400,
                        "INVALID_PAYLOAD"
                    )
                );
            }

            // Process callback
            const result = await paymentService.processWebhookCallback(validationResult.data);

            res.status(200).json({
                received: result.received,
                transactionId: result.transactionId,
                message: "Payment status updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export const paymentController = new PaymentController();
