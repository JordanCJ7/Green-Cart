import { Router, Request, Response, NextFunction } from "express";
import { internalAuth } from "../middleware/internalAuth";
import { User } from "../models/User";
import { AppError } from "../errors/AppError";
import mongoose from "mongoose";

const router = Router();

/**
 * GET /auth/internal/users/:id
 * Internal endpoint for other microservices to fetch user details.
 * Protected by internal API key (x-internal-api-key header).
 * Returns: { user: { _id, email, phone, role } }
 */
router.get(
    "/users/:id",
    internalAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return next(new AppError("Invalid user ID.", 400, "INVALID_ID"));
            }

            const user = await User.findById(id).select("email phone role").lean();
            if (!user) {
                return next(new AppError("User not found.", 404, "NOT_FOUND"));
            }

            res.json({
                user: {
                    _id: user._id,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
