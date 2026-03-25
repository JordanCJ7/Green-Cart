import { Router } from "express";
import { wishlistController } from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

/**
 * GET /wishlist
 * Get customer's wishlist
 */
router.get("/", wishlistController.getWishlist.bind(wishlistController));

/**
 * POST /wishlist
 * Add item to wishlist
 */
router.post("/", wishlistController.addToWishlist.bind(wishlistController));

/**
 * POST /wishlist/check-wishlisted
 * Batch check if items are wishlisted
 */
router.post("/check-wishlisted", wishlistController.checkWishlisted.bind(wishlistController));

/**
 * DELETE /wishlist/:itemId
 * Remove item from wishlist
 */
router.delete("/:itemId", wishlistController.removeFromWishlist.bind(wishlistController));

/**
 * DELETE /wishlist
 * Clear entire wishlist
 */
router.delete("/", wishlistController.clearWishlist.bind(wishlistController));

export default router;
