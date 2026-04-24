import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { AppError } from "../errors/AppError";

/**
 * GET /internal/users/:id
 * Service-to-service user contact lookup (phone number for SMS).
 */
export async function getUserByIdInternal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await User.findById(req.params.id, { passwordHash: 0, refreshTokenHash: 0, __v: 0 }).lean();
        if (!user) {
            return next(new AppError("User not found.", 404, "NOT_FOUND"));
        }

        res.status(200).json({
            user: {
                userId: String(user._id),
                email: user.email,
                phone: user.phone || "",
                role: user.role,
            }
        });
    } catch (err) {
        next(err);
    }
}
