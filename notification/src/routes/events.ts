import { Router, Request, Response, NextFunction } from "express";
import { internalAuth } from "../middleware/internalAuth.js";
import { internalEventSchema } from "../validation/notificationSchemas.js";
import { notificationService } from "../services/notification.service.js";
import { getUserContactById } from "../services/authenticationClient.service.js";
import { sendSms } from "../services/sms.service.js";

const router = Router();

router.use(internalAuth);

router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventType, data } = internalEventSchema.parse(req.body);

    const getString = (key: string): string | undefined => {
      const value = data[key];
      return typeof value === "string" ? value : undefined;
    };

    const getNumber = (key: string): number | undefined => {
      const value = data[key];
      return typeof value === "number" ? value : undefined;
    };

    const buildPaymentSummary = (): { transactionId?: string; orderId?: string; userId?: string; amount?: number; currency?: string; status?: string } => {
      return {
        transactionId: getString("transactionId"),
        orderId: getString("orderId"),
        userId: getString("userId"),
        amount: getNumber("amount"),
        currency: getString("currency"),
        status: getString("status"),
      };
    };

    const formatMoney = (amount?: number, currency?: string): string => {
      if (typeof amount !== "number") return "";
      const ccy = currency || "";
      return `${amount}${ccy ? ` ${ccy}` : ""}`;
    };

    switch (eventType) {
      case "PAYMENT_CREATED": {
        const p = buildPaymentSummary();
        const amountStr = formatMoney(p.amount, p.currency);
        const message = `Payment transaction created: ${p.transactionId ?? "(unknown)"} — order ${p.orderId ?? "(unknown)"} — user ${p.userId ?? "(unknown)"}${amountStr ? ` — amount ${amountStr}` : ""}`;

        const notification = await notificationService.createNotification({
          userId: null,
          type: "payment",
          message,
          metadata: { eventType, ...data },
        });

        res.status(201).json({ notification });
        return;
      }

      case "PAYMENT_STATUS_CHANGED": {
        const p = buildPaymentSummary();
        const amountStr = formatMoney(p.amount, p.currency);
        const statusStr = p.status ?? "(unknown)";

        const adminMessage = `Payment update: ${p.transactionId ?? "(unknown)"} — order ${p.orderId ?? "(unknown)"} — user ${p.userId ?? "(unknown)"} — status ${statusStr}${amountStr ? ` — amount ${amountStr}` : ""}`;
        const adminNotification = await notificationService.createNotification({
          userId: null,
          type: "payment",
          message: adminMessage,
          metadata: { eventType, ...data },
        });

        // If completed, also notify the user + attempt SMS
        if (statusStr === "completed") {
          const userId = p.userId ?? "";
          if (!userId) {
            res.status(201).json({ notification: adminNotification, channels: { inAppAdmin: true, inAppUser: false, smsSent: false } });
            return;
          }

          const userMessage = `Payment successful for order ${p.orderId ?? "(unknown)"}. ${amountStr ? `Amount ${amountStr}. ` : ""}Transaction ${p.transactionId ?? "(unknown)"}.`;

          const userNotification = await notificationService.createNotification({
            userId,
            type: "payment",
            message: userMessage,
            metadata: { eventType, ...data },
          });

          let smsSent = false;
          try {
            const contact = await getUserContactById(userId);
            if (contact?.phone) {
              smsSent = await sendSms({
                to: contact.phone,
                body: userMessage,
              });
            }
          } catch (err) {
            console.error("PAYMENT_STATUS_CHANGED SMS flow failed:", err);
          }

          res.status(201).json({
            adminNotification,
            notification: userNotification,
            channels: { inAppAdmin: true, inAppUser: true, smsSent },
          });
          return;
        }

        res.status(201).json({ notification: adminNotification });
        return;
      }

      case "ITEM_CREATED": {
        const itemName = typeof data.name === "string" ? data.name : "Item";
        const notification = await notificationService.createNotification({
          userId: null,
          type: "inventory",
          message: `Inventory: created ${itemName}`,
          metadata: { eventType, ...data },
        });
        res.status(201).json({ notification });
        return;
      }

      case "ITEM_UPDATED": {
        const itemName = typeof data.name === "string" ? data.name : "Item";
        const notification = await notificationService.createNotification({
          userId: null,
          type: "inventory",
          message: `Inventory: updated ${itemName}`,
          metadata: { eventType, ...data },
        });
        res.status(201).json({ notification });
        return;
      }

      case "ITEM_DELETED": {
        const itemName = typeof data.name === "string" ? data.name : "Item";
        const notification = await notificationService.createNotification({
          userId: null,
          type: "inventory",
          message: `Inventory: deleted ${itemName}`,
          metadata: { eventType, ...data },
        });
        res.status(201).json({ notification });
        return;
      }

      case "USER_REGISTERED": {
        const email = typeof data.email === "string" ? data.email : "(unknown email)";
        const notification = await notificationService.createNotification({
          userId: null,
          type: "user",
          message: `New user registered: ${email}`,
          metadata: { eventType, ...data },
        });
        res.status(201).json({ notification });
        return;
      }

      case "CART_ITEM_ADDED": {
        const userId = typeof data.userId === "string" ? data.userId : "";
        if (!userId) {
          res.status(400).json({ error: "data.userId is required" });
          return;
        }
        const itemName = typeof data.itemName === "string" ? data.itemName : "item";
        const notification = await notificationService.createNotification({
          userId,
          type: "inventory",
          message: `Added to cart: ${itemName}`,
          metadata: { eventType, ...data },
        });
        res.status(201).json({ notification });
        return;
      }

      case "CART_ITEM_REMOVED": {
        const userId = typeof data.userId === "string" ? data.userId : "";
        if (!userId) {
          res.status(400).json({ error: "data.userId is required" });
          return;
        }
        const itemName = typeof data.itemName === "string" ? data.itemName : "item";
        const notification = await notificationService.createNotification({
          userId,
          type: "inventory",
          message: `Removed from cart: ${itemName}`,
          metadata: { eventType, ...data },
        });
        res.status(201).json({ notification });
        return;
      }

      case "PAYMENT_SUCCESS": {
        const userId = typeof data.userId === "string" ? data.userId : "";
        if (!userId) {
          res.status(400).json({ error: "data.userId is required" });
          return;
        }

        const p = buildPaymentSummary();
        const amountStr = formatMoney(p.amount, p.currency);
        const userMessage = `Payment successful for order ${p.orderId ?? "(unknown)"}. ${amountStr ? `Amount ${amountStr}. ` : ""}Transaction ${p.transactionId ?? "(unknown)"}.`;

        // Always notify admin too for payment events
        const adminMessage = `Payment successful: ${p.transactionId ?? "(unknown)"} — order ${p.orderId ?? "(unknown)"} — user ${userId}${amountStr ? ` — amount ${amountStr}` : ""}`;
        const adminNotification = await notificationService.createNotification({
          userId: null,
          type: "payment",
          message: adminMessage,
          metadata: { eventType, ...data },
        });

        const notification = await notificationService.createNotification({
          userId,
          type: "payment",
          message: userMessage,
          metadata: { eventType, ...data },
        });

        // Best-effort SMS (do not fail the whole request)
        let smsSent = false;
        try {
          const contact = await getUserContactById(userId);
          if (contact?.phone) {
            smsSent = await sendSms({
              to: contact.phone,
              body: userMessage,
            });
          }
        } catch (err) {
          console.error("PAYMENT_SUCCESS SMS flow failed:", err);
        }

        res.status(201).json({ adminNotification, notification, channels: { inAppAdmin: true, inAppUser: true, smsSent } });
        return;
      }

      default: {
        res.status(400).json({ error: "Unsupported event type" });
      }
    }
  } catch (error) {
    next(error);
  }
});

export default router;
