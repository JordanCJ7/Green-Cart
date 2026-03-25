import { NotificationModel, NotificationType, NotificationRole } from "../models/Notification";
import { sendSms, buildOrderSmsBody, buildPaymentSmsBody } from "./smsService";
import { env } from "../config/env";

/** Types that trigger SMS automatically */
const SMS_TYPES: ReadonlySet<string> = new Set([
    "order_accepted",
    "order_rejected",
    "payment_completed",
    "payment_failed",
]);

interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    role: NotificationRole;
    phoneNumber?: string;
}

interface UserInfo {
    _id: string;
    email: string;
    phone?: string;
    role: string;
}

/**
 * Fetch user details (including phone) from the authentication service.
 */
export async function fetchUserFromAuthService(userId: string): Promise<UserInfo | null> {
    if (!env.AUTH_SERVICE_URL || !env.INTERNAL_API_KEY) {
        console.warn("⚠️ AUTH_SERVICE_URL or INTERNAL_API_KEY not configured — cannot fetch user.");
        return null;
    }

    try {
        const url = `${env.AUTH_SERVICE_URL.replace(/\/$/, "")}/auth/internal/users/${encodeURIComponent(userId)}`;
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "x-internal-api-key": env.INTERNAL_API_KEY,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            console.warn(`⚠️ Failed to fetch user ${userId} from auth service: ${res.status}`);
            return null;
        }

        const data = await res.json() as { user: UserInfo };
        return data.user;
    } catch (err) {
        console.error("❌ Error fetching user from auth service:", err);
        return null;
    }
}

/**
 * Create a notification and auto-send SMS for relevant types.
 * If phoneNumber is not provided but the type requires SMS,
 * it fetches the user's phone from the auth service.
 */
export async function createAndSendNotification(input: CreateNotificationInput) {
    // Create in-app notification
    const notification = await NotificationModel.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        role: input.role,
    });

    // Auto-send SMS for specific notification types
    if (SMS_TYPES.has(input.type)) {
        let phone = input.phoneNumber;

        // Fetch phone from auth service if not provided
        if (!phone) {
            const user = await fetchUserFromAuthService(input.userId);
            phone = user?.phone;
        }

        if (phone) {
            const body = (input.type === "payment_completed" || input.type === "payment_failed")
                ? buildPaymentSmsBody(input.title, input.message)
                : buildOrderSmsBody(input.title, input.message);

            const sent = await sendSms({ to: phone, body });
            if (sent) {
                notification.smsSent = true;
                await notification.save();
            }
        } else {
            console.warn(`⚠️ No phone number available for user ${input.userId} — SMS skipped.`);
        }
    }

    return notification;
}
