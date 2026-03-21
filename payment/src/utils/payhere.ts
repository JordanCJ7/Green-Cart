import crypto from "crypto";

function md5Upper(value: string): string {
    return crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

/**
 * Verify PayHere webhook signature (MD5 hash)
 * PayHere calculates: md5(merchant_id + order_id + amount + status_code + secret_key)
 */
export function verifyPayHereSignature(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    statusCode: string,
    providedSignature: string,
    merchantSecret: string
): boolean {
    // PayHere notify signature formula:
    // MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret))
    const secretHash = md5Upper(merchantSecret);
    const hashInput = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
    const calculatedSignature = md5Upper(hashInput);

    // Constant-time comparison prevents timing attacks
    // First check length to avoid timingSafeEqual error on different lengths
    if (Buffer.byteLength(providedSignature) !== Buffer.byteLength(calculatedSignature)) {
        return false;
    }

    try {
        return crypto.timingSafeEqual(
            Buffer.from(providedSignature.toUpperCase()),
            Buffer.from(calculatedSignature)
        );
    } catch {
        return false;
    }
}

export function generatePayHerePaymentHash(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    merchantSecret: string
): string {
    // PayHere checkout hash formula:
    // MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))
    const secretHash = md5Upper(merchantSecret);
    return md5Upper(`${merchantId}${orderId}${amount}${currency}${secretHash}`);
}

/**
 * Map PayHere status codes to internal payment statuses
 * PayHere status codes:
 * - 2 = Success
 * - Other = Failed/Cancelled/Pending
 */
export function mapPayHereStatusToInternal(
    payHereStatusCode: string
): "completed" | "failed" | "pending" {
    switch (payHereStatusCode) {
        case "2":
            return "completed";
        case "0":
        case "-1":
        case "-2":
        case "-3":
            return "failed";
        default:
            return "pending";
    }
}

/**
 * Generate idempotency key from order and customer IDs
 * Used to prevent duplicate payment creation
 */
export function generateIdempotencyKey(customerId: string, orderId: string): string {
    return crypto.createHash("sha256").update(`${customerId}:${orderId}`).digest("hex");
}
