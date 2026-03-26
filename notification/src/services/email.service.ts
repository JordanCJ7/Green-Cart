import nodemailer from "nodemailer";
import { env } from "../config/env.js";

interface SendNotificationEmailInput {
  to: string;
  title: string;
  message: string;
  actionUrl?: string;
}

function createTransporter() {
  const auth = env.SMTP_USER && env.SMTP_PASSWORD
    ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
    : undefined;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth,
  });
}

function buildHtml(title: string, message: string, actionUrl?: string): string {
  const action = actionUrl
    ? `<p><a href="${actionUrl}" style="color:#1d4ed8;">Open details</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">${title}</h2>
      <p style="margin: 0 0 12px;">${message}</p>
      ${action}
      <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">Green Cart Notification Service</p>
    </div>
  `;
}

export async function sendNotificationEmail(input: SendNotificationEmailInput): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.title,
      html: buildHtml(input.title, input.message, input.actionUrl),
    });
    return true;
  } catch (error) {
    console.error("Failed to send notification email:", error);
    return false;
  }
}
