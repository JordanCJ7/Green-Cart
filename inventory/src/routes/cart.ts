import { Router } from "express";
import { cartController } from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * GET /cart
 * Get customer's cart
 */
router.get("/", cartController.getCart.bind(cartController));

/**
 * POST /cart
 * Add item to cart
 */
router.post("/", cartController.addToCart.bind(cartController));

/**
 * PATCH /cart/:itemId
 * Update item quantity in cart
 */
router.patch("/:itemId", cartController.updateCartItem.bind(cartController));

/**
 * DELETE /cart/:itemId
 * Remove item from cart
 */
router.delete("/:itemId", cartController.removeFromCart.bind(cartController));

/**
 * DELETE /cart
 * Clear entire cart
 */
router.delete("/", cartController.clearCart.bind(cartController));

export default router;
