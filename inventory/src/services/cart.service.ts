import { Cart, ICart, ICartItem } from "../models/Cart.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { AppError } from "../errors/AppError.js";

export class CartService {
    /**
     * Get or create cart for customer
     */
    async getCart(customerId: string): Promise<ICart> {
        let cart = await Cart.findOne({ customerId });
        
        if (!cart) {
            cart = new Cart({
                customerId,
                items: [],
                totalItems: 0,
                totalPrice: 0
            });
            await cart.save();
        }

        return cart;
    }

    /**
     * Add item to cart
     */
    async addToCart(
        customerId: string,
        itemId: string,
        quantity: number
    ): Promise<ICart> {
        if (quantity < 1) {
            throw new AppError("Quantity must be at least 1", 400, "INVALID_QUANTITY");
        }

        // Verify item exists and get details
        const item = await InventoryItem.findById(itemId);
        if (!item) {
            throw new AppError("Item not found", 404, "ITEM_NOT_FOUND");
        }

        if (!item.isActive) {
            throw new AppError("Item is no longer available", 400, "ITEM_INACTIVE");
        }

        if (item.stock < quantity) {
            throw new AppError(`Insufficient stock. Available: ${item.stock}`, 400, "INSUFFICIENT_STOCK");
        }

        // Get or create cart
        let cart = await this.getCart(customerId);

        // Check if item already in cart
        const existingIndex = cart.items.findIndex(i => i.itemId === itemId);

        if (existingIndex >= 0) {
            // Update quantity
            const newQuantity = cart.items[existingIndex].quantity + quantity;
            if (item.stock < newQuantity) {
                throw new AppError(`Insufficient stock. Available: ${item.stock}`, 400, "INSUFFICIENT_STOCK");
            }
            cart.items[existingIndex].quantity = newQuantity;
        } else {
            // Add new item
            const cartItem: ICartItem = {
                itemId: String(item._id),
                name: item.name,
                price: item.price,
                quantity,
                sku: item.sku,
                image: item.images?.[0] || ""
            };
            cart.items.push(cartItem);
        }

        // Recalculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();
        return cart;
    }

    /**
     * Update item quantity in cart
     */
    async updateCartItem(
        customerId: string,
        itemId: string,
        quantity: number
    ): Promise<ICart> {
        if (quantity < 0) {
            throw new AppError("Quantity cannot be negative", 400, "INVALID_QUANTITY");
        }

        const cart = await this.getCart(customerId);
        const itemIndex = cart.items.findIndex(i => i.itemId === itemId);

        if (itemIndex < 0) {
            throw new AppError("Item not in cart", 404, "ITEM_NOT_IN_CART");
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Verify stock
            const item = await InventoryItem.findById(itemId);
            if (!item) {
                throw new AppError("Item not found", 404, "ITEM_NOT_FOUND");
            }

            if (item.stock < quantity) {
                throw new AppError(`Insufficient stock. Available: ${item.stock}`, 400, "INSUFFICIENT_STOCK");
            }

            cart.items[itemIndex].quantity = quantity;
        }

        // Recalculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();
        return cart;
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(customerId: string, itemId: string): Promise<ICart> {
        const cart = await this.getCart(customerId);
        
        const itemIndex = cart.items.findIndex(i => i.itemId === itemId);
        if (itemIndex < 0) {
            throw new AppError("Item not in cart", 404, "ITEM_NOT_IN_CART");
        }

        cart.items.splice(itemIndex, 1);

        // Recalculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();
        return cart;
    }

    /**
     * Clear entire cart
     */
    async clearCart(customerId: string): Promise<ICart> {
        const cart = await this.getCart(customerId);
        cart.items = [];
        cart.totalItems = 0;
        cart.totalPrice = 0;
        await cart.save();
        return cart;
    }
}

export const cartService = new CartService();
