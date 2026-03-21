import { z } from "zod";

export const initiatePaymentSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    customerId: z.string().min(1, "Customer ID is required"),
    amount: z.number().positive("Amount must be greater than 0"),
    currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
    returnUrl: z.string().url("Return URL must be a valid URL"),
    items: z
        .array(
            z.object({
                name: z.string(),
                quantity: z.number().positive(),
                price: z.number().positive(),
            })
        )
        .optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const payHereWebhookSchema = z.object({
    order_id: z.string().min(1),
    merchant_id: z.string().min(1),
    payment_id: z.string().min(1),
    payhere_amount: z.string(),
    payhere_currency: z.string(),
    status_code: z.string(),
    md5sig: z.string(),
    custom_1: z.string().optional(),
    custom_2: z.string().optional(),
});

export type PayHereWebhookInput = z.infer<typeof payHereWebhookSchema>;
