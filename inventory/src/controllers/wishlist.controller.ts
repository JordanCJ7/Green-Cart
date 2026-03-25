import { Request, Response, NextFunction } from "express";
import { wishlistService } from "../services/wishlist.service.js";
import { addToWishlistSchema, checkWishlistedSchema } from "../validation/cartWishlistSchemas.js";
import { AppError } from "../errors/AppError.js";
import { AuthPayload } from "../middleware/authenticate.js";

export class WishlistController {
    /**
     * GET /wishlist
     * Get customer's wishlist
     */
    async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const wishlist = await wishlistService.getWishlist(user.sub);

            res.status(200).json(wishlist);
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /wishlist
     * Add item to wishlist
     */
    async addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;

            const validationResult = addToWishlistSchema.safeParse(req.body);
            if (!validationResult.success) {
                const messages = validationResult.error.errors.map(e => e.message).join(", ");
                return next(new AppError(messages, 422, "VALIDATION_ERROR"));
            }

            const { itemId } = validationResult.data;
            const wishlist = await wishlistService.addToWishlist(user.sub, itemId);

            res.status(200).json(wishlist);
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /wishlist/:itemId
     * Remove item from wishlist
     */
    async removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const { itemId } = req.params;

            const wishlist = await wishlistService.removeFromWishlist(user.sub, itemId);

            res.status(200).json(wishlist);
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /wishlist/check-wishlisted
     * Batch check if items are wishlisted
     */
    async checkWishlisted(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;

            const validationResult = checkWishlistedSchema.safeParse(req.body);
            if (!validationResult.success) {
                const messages = validationResult.error.errors.map(e => e.message).join(", ");
                return next(new AppError(messages, 422, "VALIDATION_ERROR"));
            }

            const { itemIds } = validationResult.data;
            const wishlisted = await wishlistService.checkWishlisted(user.sub, itemIds);

            res.status(200).json(wishlisted);
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /wishlist
     * Clear entire wishlist
     */
    async clearWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const wishlist = await wishlistService.clearWishlist(user.sub);

            res.status(200).json(wishlist);
        } catch (err) {
            next(err);
        }
    }
}

export const wishlistController = new WishlistController();
