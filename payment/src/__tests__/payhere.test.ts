import { describe, expect, it } from "vitest";
import {
    generateIdempotencyKey,
    generatePayHerePaymentHash,
    mapPayHereStatusToInternal,
    verifyPayHereSignature,
} from "../utils/payhere.js";
import crypto from "crypto";

describe("PayHere Utilities", () => {
    describe("verifyPayHereSignature", () => {
        it("should verify valid signature", () => {
            const merchantId = "123456";
            const orderId = "order_123";
            const amount = "99.99";
            const currency = "LKR";
            const statusCode = "2";
            const secret = "test_secret_123";

            const secretHash = crypto.createHash("md5").update(secret).digest("hex").toUpperCase();
            const hashInput = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
            const expectedSig = crypto.createHash("md5").update(hashInput).digest("hex").toUpperCase();

            const isValid = verifyPayHereSignature(
                merchantId,
                orderId,
                amount,
                currency,
                statusCode,
                expectedSig,
                secret
            );
            expect(isValid).toBe(true);
        });

        it("should reject invalid signature", () => {
            const merchantId = "123456";
            const orderId = "order_123";
            const amount = "99.99";
            const currency = "LKR";
            const statusCode = "2";
            const secret = "test_secret";
            const invalidSig = "invalid_signature_hash";

            const isValid = verifyPayHereSignature(
                merchantId,
                orderId,
                amount,
                currency,
                statusCode,
                invalidSig,
                secret
            );
            expect(isValid).toBe(false);
        });

        it("should generate payment hash for checkout payload", () => {
            const hash = generatePayHerePaymentHash(
                "123456",
                "order_123",
                "99.99",
                "LKR",
                "secret_abc"
            );

            expect(hash).toMatch(/^[A-F0-9]{32}$/);
        });
    });

    describe("mapPayHereStatusToInternal", () => {
        it("should map success status", () => {
            expect(mapPayHereStatusToInternal("2")).toBe("completed");
        });

        it("should map failed statuses", () => {
            expect(mapPayHereStatusToInternal("0")).toBe("failed");
            expect(mapPayHereStatusToInternal("-1")).toBe("failed");
            expect(mapPayHereStatusToInternal("-2")).toBe("failed");
            expect(mapPayHereStatusToInternal("-3")).toBe("failed");
        });

        it("should map unknown statuses to pending", () => {
            expect(mapPayHereStatusToInternal("1")).toBe("pending");
            expect(mapPayHereStatusToInternal("99")).toBe("pending");
        });
    });

    describe("generateIdempotencyKey", () => {
        it("should generate consistent key for same input", () => {
            const key1 = generateIdempotencyKey("customer_123", "order_456");
            const key2 = generateIdempotencyKey("customer_123", "order_456");
            expect(key1).toBe(key2);
        });

        it("should generate different keys for different input", () => {
            const key1 = generateIdempotencyKey("customer_123", "order_456");
            const key2 = generateIdempotencyKey("customer_789", "order_456");
            expect(key1).not.toBe(key2);
        });
    });
});
