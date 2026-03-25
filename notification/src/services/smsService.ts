import twilio from "twilio";
import { env } from "../config/env";

function getClient() {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
        return null;
    }
    return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

interface SmsOptions {
    to: string;
    body: string;
}

export async function sendSms(options: SmsOptions): Promise<boolean> {
    const client = getClient();
    if (!client || !env.TWILIO_PHONE_NUMBER) {
        console.warn("⚠️ Twilio credentials not configured — skipping SMS.");
        return false;
    }

    try {
        await client.messages.create({
            from: env.TWILIO_PHONE_NUMBER,
            to: options.to,
            body: options.body,
        });
        return true;
    } catch (err) {
        console.error("❌ Failed to send SMS:", err);
        return false;
    }
}

export function buildOrderSmsBody(title: string, message: string): string {
    return `🛒 Green-Cart: ${title}\n\n${message}`;
}

export function buildPaymentSmsBody(title: string, message: string): string {
    return `💳 Green-Cart: ${title}\n\n${message}`;
}
