import mongoose from "mongoose";
import { InventoryItem, IInventoryItem } from "../models/InventoryItem";
import { Transaction, TransactionType } from "../models/Transaction";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";

const PREDEFINED_CATEGORIES = [
    "Grocery & Staples",
    "Beverages",
    "Dairy & Chilled",
    "Fruits & Vegetables",
    "Meat & Seafood",
    "Snacks & Confectionery",
    "Household & Cleaning",
    "Personal Care & Beauty"
] as const;

const CATEGORY_ALIASES: Record<string, (typeof PREDEFINED_CATEGORIES)[number]> = {
    "dairy & beverages": "Dairy & Chilled",
    "dairy and beverages": "Dairy & Chilled",
    "daily & beverages": "Dairy & Chilled",
    "daily and beverages": "Dairy & Chilled"
};

export interface CreateItemData {
    name: string;
    description?: string;
    category: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock?: number;
    lowStockThreshold?: number;
    unit: string;
    images?: string[];
    isActive?: boolean;
}

export interface UpdateItemData {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    compareAtPrice?: number;
    stock?: number;
    lowStockThreshold?: number;
    unit?: string;
    images?: string[];
    isActive?: boolean;
}

export interface StockUpdateData {
    quantity: number;
    type: TransactionType;
    reason?: string;
    reference?: string;
    notes?: string;
    performedBy?: string;
}

export interface QueryFilters {
    isActive?: boolean;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    lowStock?: boolean;
    search?: string;
}

export interface PaginationOptions {
    page: number;
    limit: number;
    sort?: string;
}

class InventoryService {
    private normalizeCategory(category: string): string {
        const normalized = category.trim().replace(/\s+/g, " ");
        const normalizedKey = normalized.toLowerCase();

        const aliased = CATEGORY_ALIASES[normalizedKey] ?? normalized;
        const canonical = PREDEFINED_CATEGORIES.find((value) => value.toLowerCase() === aliased.toLowerCase());

        if (!canonical) {
            throw new AppError("Invalid category. Please select one of the predefined categories.", 422, "INVALID_CATEGORY");
        }

        return canonical;
    }

    private normalizeImages(images?: string[]): string[] {
        if (!images) {
            return [];
        }

        return Array.from(
            new Set(
                images
                    .map((image) => image.trim())
                    .filter((image) => image.length > 0)
            )
        );
    }

    async createItem(data: CreateItemData): Promise<IInventoryItem> {
        const payload = {
            ...data,
            category: this.normalizeCategory(data.category),
            images: this.normalizeImages(data.images),
            sku: data.sku.trim().toUpperCase(),
            unit: data.unit.trim()
        };

        const item = await InventoryItem.create(payload);

        if (item.stock > 0) {
            await Transaction.create({
                item: item._id,
                type: "in",
                quantity: item.stock,
                previousStock: 0,
                newStock: item.stock,
                reason: "Initial stock",
                performedBy: "system"
            });
        }

        return item;
    }

    async getAllItems(filters: QueryFilters, pagination: PaginationOptions) {
        const query: Record<string, unknown> = {};

        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        if (filters.category) {
            query.category = filters.category;
        }

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            query.price = {};
            if (filters.minPrice !== undefined) {
                (query.price as Record<string, number>).$gte = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                (query.price as Record<string, number>).$lte = filters.maxPrice;
            }
        }

        if (filters.inStock) {
            query.stock = { $gt: 0 };
        }

        if (filters.lowStock) {
            query.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
        }

        if (filters.search) {
            // Use $regex with properly escaped pattern for safe text search
            // Escape special regex characters to prevent injection attacks
            const escapedSearch = filters.search.replaceAll(/[.*+?^${}()|[\]\\]/g, (match) => `\\${match}`);
            query.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { description: { $regex: escapedSearch, $options: 'i' } },
                { sku: { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        const page = Math.max(1, pagination.page);
        const limit = Math.min(Math.max(1, pagination.limit), env.MAX_PAGE_SIZE);
        const skip = (page - 1) * limit;

        // Whitelist of allowed sort fields to prevent injection
        const ALLOWED_SORT_FIELDS = new Set(["name", "sku", "price", "stock", "createdAt", "updatedAt", "unit"]);
        
        const sortOptions: Record<string, 1 | -1> = {};
        if (pagination.sort) {
            const sortFields = pagination.sort.split(",");
            sortFields.forEach(field => {
                const cleanField = field.trim();
                if (!cleanField) return;
                
                if (cleanField.startsWith("-")) {
                    const fieldName = cleanField.slice(1);
                    if (ALLOWED_SORT_FIELDS.has(fieldName)) {
                        sortOptions[fieldName] = -1;
                    }
                } else if (ALLOWED_SORT_FIELDS.has(cleanField)) {
                    sortOptions[cleanField] = 1;
                }
            });
            if (Object.keys(sortOptions).length === 0) {
                sortOptions.createdAt = -1;
            }
        } else {
            sortOptions.createdAt = -1;
        }

        const [items, total] = await Promise.all([
            InventoryItem.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            InventoryItem.countDocuments(query)
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getItemById(id: string): Promise<IInventoryItem> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid item ID.", 400, "INVALID_ID");
        }

        const item = await InventoryItem.findById(id);
        if (!item) {
            throw new AppError("Item not found.", 404, "ITEM_NOT_FOUND");
        }

        return item;
    }

    async getItemBySku(sku: string): Promise<IInventoryItem> {
        const item = await InventoryItem.findOne({ sku: sku.toUpperCase() });
        if (!item) {
            throw new AppError("Item not found.", 404, "ITEM_NOT_FOUND");
        }

        return item;
    }

    async updateItem(id: string, data: UpdateItemData): Promise<IInventoryItem> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid item ID.", 400, "INVALID_ID");
        }

        const updateData: UpdateItemData = { ...data };

        if (updateData.category !== undefined) {
            updateData.category = this.normalizeCategory(updateData.category);
        }

        if (updateData.images !== undefined) {
            updateData.images = this.normalizeImages(updateData.images);
        }

        if (updateData.unit !== undefined) {
            updateData.unit = updateData.unit.trim();
        }

        const item = await InventoryItem.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!item) {
            throw new AppError("Item not found.", 404, "ITEM_NOT_FOUND");
        }

        return item;
    }

    async deleteItem(id: string): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid item ID.", 400, "INVALID_ID");
        }

        const item = await InventoryItem.findByIdAndDelete(id);
        if (!item) {
            throw new AppError("Item not found.", 404, "ITEM_NOT_FOUND");
        }
    }

    async updateStock(id: string, data: StockUpdateData): Promise<IInventoryItem> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid item ID.", 400, "INVALID_ID");
        }

        const item = await InventoryItem.findById(id);
        if (!item) {
            throw new AppError("Item not found.", 404, "ITEM_NOT_FOUND");
        }

        const previousStock = item.stock;
        let newStock: number;

        switch (data.type) {
            case "in":
                newStock = previousStock + Math.abs(data.quantity);
                break;
            case "out":
                newStock = previousStock - Math.abs(data.quantity);
                if (newStock < 0) {
                    throw new AppError("Insufficient stock.", 400, "INSUFFICIENT_STOCK");
                }
                break;
            case "adjustment":
                newStock = previousStock + data.quantity;
                if (newStock < 0) {
                    throw new AppError("Stock cannot be negative after adjustment.", 400, "INVALID_ADJUSTMENT");
                }
                break;
        }

        item.stock = newStock;
        await item.save();

        await Transaction.create({
            item: item._id,
            type: data.type,
            quantity: Math.abs(data.quantity),
            previousStock,
            newStock,
            reason: data.reason,
            reference: data.reference,
            notes: data.notes,
            performedBy: data.performedBy
        });

        return item;
    }

    async getTransactionHistory(
        itemId: string,
        page: number = 1,
        limit: number = 20
    ) {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            throw new AppError("Invalid item ID.", 400, "INVALID_ID");
        }

        const item = await InventoryItem.findById(itemId);
        if (!item) {
            throw new AppError("Item not found.", 404, "ITEM_NOT_FOUND");
        }

        const skip = (Math.max(1, page) - 1) * Math.min(Math.max(1, limit), env.MAX_PAGE_SIZE);
        const effectiveLimit = Math.min(Math.max(1, limit), env.MAX_PAGE_SIZE);

        const [transactions, total] = await Promise.all([
            Transaction.find({ item: itemId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(effectiveLimit)
                .lean(),
            Transaction.countDocuments({ item: itemId })
        ]);

        return {
            transactions,
            pagination: {
                page: Math.max(1, page),
                limit: effectiveLimit,
                total,
                totalPages: Math.ceil(total / effectiveLimit)
            }
        };
    }

    async getLowStockItems(threshold?: number) {
        const effectiveThreshold = threshold ?? env.LOW_STOCK_THRESHOLD;

        const items = await InventoryItem.find({
            $expr: { $lte: ["$stock", "$lowStockThreshold"] },
            isActive: true
        })
            .sort({ stock: 1 })
            .lean();

        return items.filter(item => item.stock <= effectiveThreshold);
    }

    async getCategories(): Promise<string[]> {
        return [...PREDEFINED_CATEGORIES];
    }

    async checkAvailability(id: string, quantity: number): Promise<{ available: boolean; currentStock: number }> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid item ID.", 400, "INVALID_ID");
        }

        const item = await InventoryItem.findById(id);
        if (!item) {
            throw new AppError("Item not found.", 404, "ITEM_NOT_FOUND");
        }

        if (!item.isActive) {
            return { available: false, currentStock: item.stock };
        }

        return {
            available: item.stock >= quantity,
            currentStock: item.stock
        };
    }

    async bulkCheckAvailability(items: Array<{ id: string; quantity: number }>) {
        const results = await Promise.all(
            items.map(async ({ id, quantity }) => {
                try {
                    const result = await this.checkAvailability(id, quantity);
                    return { id, ...result, error: null };
                } catch (error) {
                    return {
                        id,
                        available: false,
                        currentStock: 0,
                        error: error instanceof Error ? error.message : "Unknown error"
                    };
                }
            })
        );

        return results;
    }
}

export const inventoryService = new InventoryService();
