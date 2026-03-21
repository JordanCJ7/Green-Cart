import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { notificationRateLimiter } from "../middleware/rateLimiter";
import { getAnalytics } from "../controllers/analytics.controller";

const router = Router();

router.use(notificationRateLimiter);
router.use(authenticate);

router.get("/", getAnalytics);

export default router;
