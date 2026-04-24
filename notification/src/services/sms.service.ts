import { env } from "../config/env.js";

interface SendSmsInput {
  to: string;
  body: string;
}

function isTwilioConfigured(): boolean {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);
}

export async function sendSms(input: SendSmsInput): Promise<boolean> {
  if (!isTwilioConfigured()) {
    return false;
  }

  const from = env.TWILIO_FROM_NUMBER as string;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");

  const body = new URLSearchParams({
    To: input.to,
    From: from,
    Body: input.body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Twilio SMS failed (${res.status}):`, text || res.statusText);
    return false;
  }

  return true;
}
