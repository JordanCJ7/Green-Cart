import { Router } from "express";
import { register, login, refresh, logout, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
