import { Router } from "express";
import { register, login, refresh, logout, me, updateMe, deleteMe, listUsers, updateUserRole, deleteUser } from "../controllers/auth.controller";
import { authenticate, requireAdmin } from "../middleware/authenticate";
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
router.patch("/me", authenticate, updateMe);
router.delete("/me", authenticate, deleteMe);
router.get("/users", authenticate, requireAdmin, listUsers);
router.patch("/users/:id/role", authenticate, requireAdmin, updateUserRole);
router.delete("/users/:id", authenticate, requireAdmin, deleteUser);

export default router;
