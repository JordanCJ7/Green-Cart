import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { notificationRateLimiter } from "../middleware/rateLimiter";
import {
    getNotifications,
    getNotificationStats,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notification.controller";

const router = Router();

router.use(notificationRateLimiter);
router.use(authenticate);

router.get("/", getNotifications);
router.get("/stats", getNotificationStats);
router.post("/", createNotification);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

export default router;
