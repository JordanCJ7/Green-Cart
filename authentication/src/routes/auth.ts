import { Router } from "express";
import { register, login, refresh, logout, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { authApiRateLimiter, loginAttemptRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Apply a relaxed limiter for all auth endpoints.
router.use(authApiRateLimiter);

// Apply stricter protection only on credential/registration attempts.
router.post("/register", loginAttemptRateLimiter, register);
router.post("/login", loginAttemptRateLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
