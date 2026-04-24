import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service.js";
import { addToCartSchema, updateCartItemSchema } from "../validation/cartWishlistSchemas.js";
import { AppError } from "../errors/AppError.js";
import { AuthPayload } from "../middleware/authenticate.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { emitNotificationEvent } from "../services/notificationEvents";

export class CartController {
    /**
     * GET /cart
     * Get customer's cart
     */
    async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const cart = await cartService.getCart(user.sub);

            res.status(200).json(cart);
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /cart
     * Add item to cart
     */
    async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;

            const validationResult = addToCartSchema.safeParse(req.body);
            if (!validationResult.success) {
                const messages = validationResult.error.errors.map(e => e.message).join(", ");
                return next(new AppError(messages, 422, "VALIDATION_ERROR"));
            }

            const { itemId, quantity } = validationResult.data;
            const cart = await cartService.addToCart(user.sub, itemId, quantity);

            // Best-effort: user notification
            void (async () => {
                try {
                    const item = await InventoryItem.findById(itemId).lean();
                    void emitNotificationEvent("CART_ITEM_ADDED", {
                        userId: user.sub,
                        itemId,
                        itemName: item?.name || "item",
                        quantity,
                    });
                } catch (err) {
                    console.error("Failed to emit CART_ITEM_ADDED:", err);
                }
            })();

            res.status(200).json(cart);
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /cart/:itemId
     * Update item quantity in cart
     */
    async updateCartItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const { itemId } = req.params;

            const validationResult = updateCartItemSchema.safeParse(req.body);
            if (!validationResult.success) {
                const messages = validationResult.error.errors.map(e => e.message).join(", ");
                return next(new AppError(messages, 422, "VALIDATION_ERROR"));
            }

            const { quantity } = validationResult.data;
            const cart = await cartService.updateCartItem(user.sub, itemId, quantity);

            res.status(200).json(cart);
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /cart/:itemId
     * Remove item from cart
     */
    async removeFromCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const { itemId } = req.params;

            const cart = await cartService.removeFromCart(user.sub, itemId);

            void (async () => {
                try {
                    const item = await InventoryItem.findById(itemId).lean();
                    void emitNotificationEvent("CART_ITEM_REMOVED", {
                        userId: user.sub,
                        itemId,
                        itemName: item?.name || "item",
                    });
                } catch (err) {
                    console.error("Failed to emit CART_ITEM_REMOVED:", err);
                }
            })();

            res.status(200).json(cart);
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /cart
     * Clear entire cart
     */
    async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user as AuthPayload;
            const cart = await cartService.clearCart(user.sub);

            res.status(200).json(cart);
        } catch (err) {
            next(err);
        }
    }
}

export const cartController = new CartController();
