import { AppError } from "../errors/AppError";
import { Transaction, TransactionDoc } from "../models/Transaction";
import { InitiatePaymentInput, PayHereWebhookInput } from "../validation/paymentSchemas";
import {
    generateIdempotencyKey,
    generatePayHerePaymentHash,
    mapPayHereStatusToInternal,
    verifyPayHereSignature,
} from "../utils/payhere";
import { getEnvOrThrow } from "../config/env";

interface PayHereCheckoutPayload {
    merchant_id: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    order_id: string;
    items: string;
    currency: string;
    amount: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    hash: string;
}

export class PaymentService {
    /**
     * Initiate a payment session with PayHere
     * Creates a pending transaction and returns checkout URL
     */
    async initiatePayment(input: InitiatePaymentInput, customerId: string): Promise<{
        transactionId: string;
        checkoutUrl: string;
        paymentPayload: PayHereCheckoutPayload;
        status: string;
        createdAt: Date;
    }> {
        const env = getEnvOrThrow();
        // Verify customer ID matches JWT token (ownership)
        if (customerId !== input.customerId) {
            throw new AppError("Customer ID mismatch", 403, "FORBIDDEN");
        }

        // Check for idempotency — prevent duplicate payments for same order
        const idempotencyKey = generateIdempotencyKey(customerId, input.orderId);
        const existingTxn = await Transaction.findOne({ idempotencyKey });
        if (existingTxn) {
            const majorAmount = existingTxn.amount.toFixed(2);
            const paymentHash = generatePayHerePaymentHash(
                env.PAYHERE_MERCHANT_ID,
                existingTxn.orderId,
                majorAmount,
                existingTxn.currency,
                env.PAYHERE_SECRET_KEY
            );
            return {
                transactionId: existingTxn.transactionId,
                checkoutUrl: `${env.PAYHERE_API_URL}/pay/checkout`,
                paymentPayload: {
                    merchant_id: env.PAYHERE_MERCHANT_ID,
                    return_url: existingTxn.returnUrl || env.PAYMENT_RETURN_URL,
                    cancel_url: env.PAYMENT_CANCEL_URL,
                    notify_url: env.PAYMENT_CALLBACK_URL,
                    order_id: existingTxn.orderId,
                    items: `Green-Cart Order ${existingTxn.orderId}`,
                    currency: existingTxn.currency,
                    amount: majorAmount,
                    first_name: "Customer",
                    last_name: "",
                    email: "customer@greencart.local",
                    phone: "0000000000",
                    address: "N/A",
                    city: "N/A",
                    country: "Sri Lanka",
                    hash: paymentHash,
                },
                status: existingTxn.status,
                createdAt: existingTxn.createdAt,
            };
        }

        // Create pending transaction
        const transaction = new Transaction({
            orderId: input.orderId,
            customerId,
            amount: input.amount,
            currency: input.currency,
            returnUrl: input.returnUrl,
            idempotencyKey,
            orderSnapshot: input.items ? { items: input.items } : undefined,
            status: "pending",
        });

        await transaction.save();

        const majorAmount = transaction.amount.toFixed(2);
        const paymentHash = generatePayHerePaymentHash(
            env.PAYHERE_MERCHANT_ID,
            transaction.orderId,
            majorAmount,
            transaction.currency,
            env.PAYHERE_SECRET_KEY
        );

        const checkoutUrl = `${env.PAYHERE_API_URL}/pay/checkout`;
        const paymentPayload: PayHereCheckoutPayload = {
            merchant_id: env.PAYHERE_MERCHANT_ID,
            return_url: input.returnUrl || env.PAYMENT_RETURN_URL,
            cancel_url: env.PAYMENT_CANCEL_URL,
            notify_url: env.PAYMENT_CALLBACK_URL,
            order_id: transaction.orderId,
            items: `Green-Cart Order ${transaction.orderId}`,
            currency: transaction.currency,
            amount: majorAmount,
            first_name: "Customer",
            last_name: "",
            email: "customer@greencart.local",
            phone: "0000000000",
            address: "N/A",
            city: "N/A",
            country: "Sri Lanka",
            hash: paymentHash,
        };

        return {
            transactionId: transaction.transactionId,
            checkoutUrl,
            paymentPayload,
            status: transaction.status,
            createdAt: transaction.createdAt,
        };
    }

    /**
     * Retrieve payment transaction status
     */
    async getPaymentStatus(transactionId: string, customerId: string): Promise<TransactionDoc> {
        const transaction = await Transaction.findOne({ transactionId });

        if (!transaction) {
            throw new AppError("Transaction not found", 404, "NOT_FOUND");
        }

        // Ensure customer owns this transaction
        if (transaction.customerId !== customerId) {
            throw new AppError("Access denied", 403, "FORBIDDEN");
        }

        return transaction;
    }

    /**
     * Process PayHere webhook callback
     * Verifies signature, updates transaction status, and returns success
     */
    async processWebhookCallback(payload: PayHereWebhookInput): Promise<{
        received: boolean;
        transactionId: string;
    }> {
        const env = getEnvOrThrow();
        // Verify signature authenticity
        try {
            const isValid = verifyPayHereSignature(
                payload.merchant_id,
                payload.order_id,
                payload.payhere_amount,
                payload.payhere_currency,
                payload.status_code,
                payload.md5sig,
                env.PAYHERE_WEBHOOK_SECRET
            );

            if (!isValid) {
                throw new AppError("Invalid PayHere signature", 403, "INVALID_SIGNATURE");
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError("Signature verification failed", 403, "INVALID_SIGNATURE");
        }

        // Find transaction by order ID
        const transaction = await Transaction.findOne({ orderId: payload.order_id });

        if (!transaction) {
            throw new AppError("Transaction not found for order", 404, "NOT_FOUND");
        }

        // Verify merchant ID matches
        if (payload.merchant_id !== env.PAYHERE_MERCHANT_ID) {
            throw new AppError("Merchant ID mismatch", 403, "INVALID_MERCHANT");
        }

        // Verify amount matches (prevent amount tampering)
        const webhookAmount = Number.parseFloat(payload.payhere_amount);
        if (Math.abs(webhookAmount - transaction.amount) > 0.01) {
            throw new AppError("Amount mismatch in webhook", 400, "AMOUNT_MISMATCH");
        }

        // Make webhook processing idempotent
        // Only update if status has changed
        if (transaction.payHereStatus === payload.status_code) {
            return {
                received: true,
                transactionId: transaction.transactionId,
            };
        }

        // Map PayHere status to internal status
        const newStatus = mapPayHereStatusToInternal(payload.status_code);

        // Update transaction atomically
        transaction.payHereId = payload.payment_id;
        transaction.payHereStatus = payload.status_code;
        transaction.status = newStatus;

        if (newStatus === "completed" || newStatus === "failed") {
            transaction.completedAt = new Date();
        }

        await transaction.save();

        // TODO: Emit event to notification service or order service
        // e.g., pubsub.publish('payment.completed', { transactionId, ... })

        return {
            received: true,
            transactionId: transaction.transactionId,
        };
    }
}

export const paymentService = new PaymentService();
