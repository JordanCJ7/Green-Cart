import { Wishlist, IWishlist, IWishlistItem } from "../models/Wishlist.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { AppError } from "../errors/AppError.js";

export class WishlistService {
    /**
     * Get or create wishlist for customer
     */
    async getWishlist(customerId: string): Promise<IWishlist> {
        let wishlist = await Wishlist.findOne({ customerId });
        
        if (!wishlist) {
            wishlist = new Wishlist({
                customerId,
                items: []
            });
            await wishlist.save();
        }

        return wishlist;
    }

    /**
     * Add item to wishlist
     */
    async addToWishlist(customerId: string, itemId: string): Promise<IWishlist> {
        // Verify item exists and get details
        const item = await InventoryItem.findById(itemId);
        if (!item) {
            throw new AppError("Item not found", 404, "ITEM_NOT_FOUND");
        }

        // Get or create wishlist
        const wishlist = await this.getWishlist(customerId);

        // Check if item already in wishlist
        const exists = wishlist.items.some(i => i.itemId === itemId);
        if (exists) {
            throw new AppError("Item already in wishlist", 400, "ITEM_ALREADY_WISHLISTED");
        }

        // Add new item
        const wishlistItem: IWishlistItem = {
            itemId: String(item._id),
            name: item.name,
            price: item.price,
            sku: item.sku,
            image: item.images?.[0] || "",
            addedAt: new Date()
        };

        wishlist.items.push(wishlistItem);
        await wishlist.save();

        return wishlist;
    }

    /**
     * Remove item from wishlist
     */
    async removeFromWishlist(customerId: string, itemId: string): Promise<IWishlist> {
        const wishlist = await this.getWishlist(customerId);
        
        const itemIndex = wishlist.items.findIndex(i => i.itemId === itemId);
        if (itemIndex < 0) {
            throw new AppError("Item not in wishlist", 404, "ITEM_NOT_IN_WISHLIST");
        }

        wishlist.items.splice(itemIndex, 1);
        await wishlist.save();

        return wishlist;
    }

    /**
     * Batch check if items are wishlisted
     */
    async checkWishlisted(customerId: string, itemIds: string[]): Promise<Record<string, boolean>> {
        const wishlist = await this.getWishlist(customerId);
        const wishlisted: Record<string, boolean> = {};

        itemIds.forEach(id => {
            wishlisted[id] = wishlist.items.some(i => i.itemId === id);
        });

        return wishlisted;
    }

    /**
     * Clear entire wishlist
     */
    async clearWishlist(customerId: string): Promise<IWishlist> {
        const wishlist = await this.getWishlist(customerId);
        wishlist.items = [];
        await wishlist.save();
        return wishlist;
    }
}

export const wishlistService = new WishlistService();
