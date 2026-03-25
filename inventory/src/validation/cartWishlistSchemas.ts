import { z } from "zod";

export const addToCartSchema = z.object({
    itemId: z.string().min(1, "Item ID is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1")
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(0, "Quantity cannot be negative")
});

export const addToWishlistSchema = z.object({
    itemId: z.string().min(1, "Item ID is required")
});

export const checkWishlistedSchema = z.object({
    itemIds: z.array(z.string().min(1)).min(1, "At least one item ID is required")
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type CheckWishlistedInput = z.infer<typeof checkWishlistedSchema>;
