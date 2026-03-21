import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
        console.warn("⚠️ SMTP credentials not configured — skipping email.");
        return false;
    }

    try {
        await transporter.sendMail({
            from: env.SMTP_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        return true;
    } catch (err) {
        console.error("❌ Failed to send email:", err);
        return false;
    }
}

export function buildNotificationEmail(title: string, message: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#16a34a;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:20px;">🛒 Green-Cart</h1>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <h2 style="margin:0 0 12px;color:#111827;">${title}</h2>
        <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">${message}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated notification from Green-Cart.</p>
      </div>
    </body>
    </html>
  `;
}
