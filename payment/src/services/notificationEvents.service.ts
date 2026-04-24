import { getEnvOrThrow } from "../config/env.js";

export type NotificationEventType = "PAYMENT_CREATED" | "PAYMENT_STATUS_CHANGED" | "PAYMENT_SUCCESS";

export async function emitNotificationEvent(eventType: NotificationEventType, data: Record<string, unknown>): Promise<void> {
  const env = getEnvOrThrow();
  if (!env.INTERNAL_API_KEY) {
    return;
  }

  const baseUrl = env.NOTIFICATION_SERVICE_URL.replace(/\/$/, "");

  try {
    const res = await fetch(`${baseUrl}/internal/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({ eventType, data }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Failed to emit ${eventType} to notification service (${res.status}):`, text || res.statusText);
    }
  } catch (err) {
    console.error(`Failed to emit ${eventType} to notification service:`, err);
  }
}
