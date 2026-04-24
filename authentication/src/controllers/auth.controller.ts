import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { registerSchema, loginSchema, refreshSchema, updateMeSchema, updateUserRoleSchema } from "../validation/authSchemas";
import type { AuthPayload } from "../middleware/authenticate";

const BCRYPT_ROUNDS = 12;
const REFRESH_BCRYPT_ROUNDS = 10;

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(userId: string, role: "customer" | "admin"): string {
    return jwt.sign({ sub: userId, role } as AuthPayload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });
}

function signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Create a new user account and return tokens.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map((e: { message: string }) => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const { password } = parseResult.data;
        let email = parseResult.data.email;
        const phone = parseResult.data.phone;
        // Normalize email to catch duplicates reliably (schema also stores lowercase)
        email = email.toLowerCase().trim();

        const existing = await User.findOne({ email });
        if (existing) {
            return next(new AppError("A user with that email already exists.", 409, "EMAIL_TAKEN"));
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const user = await User.create({ email, phone, passwordHash });

        // sonarqube:S6670: Using String() conversion for MongoID - it's the idiomatic way
        const accessToken = signAccessToken(String(user._id), user.role);
        const refreshToken = signRefreshToken(String(user._id));

        user.refreshTokenHash = await bcrypt.hash(refreshToken, REFRESH_BCRYPT_ROUNDS);
        await user.save();

        res.status(201).json({
            user: user.toJSON(),
            accessToken,
            refreshToken
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /auth/login
 * Authenticate credentials and return tokens.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map((e: { message: string }) => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const { password } = parseResult.data;
        let email = parseResult.data.email;
        // Normalize email for case-insensitive login (schema stores lowercase)
        email = email.toLowerCase().trim();

        const user = await User.findOne({ email });
        if (!user) {
            // Same message as wrong password to prevent user enumeration
            return next(new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS"));
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return next(new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS"));
        }

        // sonarqube:S6670: Using String() conversion for MongoID - it's the idiomatic way
        const accessToken = signAccessToken(String(user._id), user.role);
        const refreshToken = signRefreshToken(String(user._id));

        user.refreshTokenHash = await bcrypt.hash(refreshToken, REFRESH_BCRYPT_ROUNDS);
        await user.save();

        res.status(200).json({
            user: user.toJSON(),
            accessToken,
            refreshToken
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /auth/refresh
 * Issue a new access token using a valid refresh token.
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = refreshSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map((e: { message: string }) => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const { refreshToken } = parseResult.data;

        let payload: { sub: string };
        try {
            payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
        } catch {
            return next(new AppError("Invalid or expired refresh token.", 401, "TOKEN_INVALID"));
        }

        const user = await User.findById(payload.sub);
        if (!user || !user.refreshTokenHash) {
            return next(new AppError("Refresh token not recognized.", 401, "TOKEN_INVALID"));
        }

        const tokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!tokenMatch) {
            return next(new AppError("Refresh token not recognized.", 401, "TOKEN_INVALID"));
        }

        // sonarqube:S6670: Using String() conversion for MongoID - it's the idiomatic way
        const newAccessToken = signAccessToken(String(user._id), user.role);

        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /auth/logout
 * Invalidate the stored refresh token for the authenticated user.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = refreshSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map((e: { message: string }) => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const { refreshToken } = parseResult.data;

        let payload: { sub: string };
        try {
            payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
        } catch {
            // Even for an invalid token we respond 204 — no info leakage
            res.status(204).send();
            return;
        }

        const user = await User.findById(payload.sub);
        if (user?.refreshTokenHash) {
            // Verify the provided token matches the stored hash before clearing it
            const tokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
            if (tokenMatch) {
                user.refreshTokenHash = null;
                await user.save();
            }
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/**
 * GET /auth/me
 * Return the authenticated user's profile. Requires Bearer token.
 */
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user) {
            return next(new AppError("Not authenticated.", 401, "UNAUTHORIZED"));
        }

        const user = await User.findById(req.user.sub);
        if (!user) {
            return next(new AppError("User not found.", 404, "NOT_FOUND"));
        }

        res.status(200).json({ user: user.toJSON() });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /auth/me
 * Update authenticated user's profile details.
 */
export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user) {
            return next(new AppError("Not authenticated.", 401, "UNAUTHORIZED"));
        }

        const parseResult = updateMeSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map((e: { message: string }) => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const user = await User.findById(req.user.sub);
        if (!user) {
            return next(new AppError("User not found.", 404, "NOT_FOUND"));
        }

        if (parseResult.data.email) {
            const normalizedEmail = parseResult.data.email.toLowerCase().trim();
            const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
            if (existing) {
                return next(new AppError("A user with that email already exists.", 409, "EMAIL_TAKEN"));
            }
            user.email = normalizedEmail;
        }

        if (parseResult.data.phone !== undefined) {
            user.phone = parseResult.data.phone.trim();
        }

        await user.save();

        res.status(200).json({ user: user.toJSON() });
    } catch (err) {
        next(err);
    }
}

/**
 * DELETE /auth/me
 * Delete authenticated user's own account.
 */
export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user) {
            return next(new AppError("Not authenticated.", 401, "UNAUTHORIZED"));
        }

        const deleted = await User.findByIdAndDelete(req.user.sub);
        if (!deleted) {
            return next(new AppError("User not found.", 404, "NOT_FOUND"));
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/**
 * GET /auth/users
 * Return all users for admin management.
 */
export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const users = await User.find({}, { passwordHash: 0, refreshTokenHash: 0, __v: 0 })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ users });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /auth/users/:id/role
 * Update a user's role. Admin only.
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = updateUserRoleSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map((e: { message: string }) => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const targetUserId = req.params.id;
        const requesterUserId = req.user?.sub;

        const user = await User.findById(targetUserId);
        if (!user) {
            return next(new AppError("User not found.", 404, "NOT_FOUND"));
        }

        // Prevent an admin from demoting their own account and losing access accidentally.
        if (requesterUserId === String(user._id) && parseResult.data.role !== "admin") {
            return next(new AppError("You cannot remove your own admin role.", 400, "SELF_ROLE_CHANGE_BLOCKED"));
        }

        user.role = parseResult.data.role;
        await user.save();

        res.status(200).json({ user: user.toJSON() });
    } catch (err) {
        next(err);
    }
}

/**
 * DELETE /auth/users/:id
 * Delete a user account. Admin only.
 */
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const targetUserId = req.params.id;
        const requesterUserId = req.user?.sub;

        if (requesterUserId === targetUserId) {
            return next(new AppError("You cannot delete your own account.", 400, "SELF_DELETE_BLOCKED"));
        }

        const deleted = await User.findByIdAndDelete(targetUserId);
        if (!deleted) {
            return next(new AppError("User not found.", 404, "NOT_FOUND"));
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
