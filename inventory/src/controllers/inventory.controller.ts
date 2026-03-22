import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { AppError } from "../errors/AppError";
import {
    createItemSchema,
    updateItemSchema,
    stockUpdateSchema
} from "../validation/inventorySchemas";
import { env } from "../config/env";

// Utility functions to reduce cognitive complexity
const validateSearchInput = (searchInput: unknown): string | undefined => {
    if (!searchInput || typeof searchInput !== "string") return undefined;
    const searchStr = searchInput.trim();
    if (!searchStr) return undefined;
    if (!/^[a-zA-Z0-9\s\-.,'"()&]+$/.test(searchStr)) {
        throw new AppError("Search query contains invalid characters.", 400, "INVALID_SEARCH");
    }
    return searchStr;
};

const parseIsActive = (value: string | undefined): boolean | undefined => {
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
};

const buildFilters = (query: Request["query"]) => {
    return {
        isActive: parseIsActive(query.isActive as string | undefined),
        minPrice: query.minPrice ? Number(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
        inStock: query.inStock === "true",
        lowStock: query.lowStock === "true",
        search: validateSearchInput(query.search)
    };
};

export async function createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = createItemSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map(e => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const data = {
            ...parseResult.data
        };

        const item = await inventoryService.createItem(data);
        res.status(201).json({ item });
    } catch (err) {
        next(err);
    }
}

export async function getAllItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const filters = buildFilters(req.query);

        const pagination = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || env.DEFAULT_PAGE_SIZE,
            sort: req.query.sort as string
        };

        const result = await inventoryService.getAllItems(filters, pagination);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const item = await inventoryService.getItemById(req.params.id);
        res.status(200).json({ item });
    } catch (err) {
        next(err);
    }
}

export async function getItemBySku(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const item = await inventoryService.getItemBySku(req.params.sku);
        res.status(200).json({ item });
    } catch (err) {
        next(err);
    }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = updateItemSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map(e => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const item = await inventoryService.updateItem(req.params.id, parseResult.data);
        res.status(200).json({ item });
    } catch (err) {
        next(err);
    }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await inventoryService.deleteItem(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = stockUpdateSchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map(e => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const data = {
            ...parseResult.data,
            performedBy: req.user?.sub
        };

        const item = await inventoryService.updateStock(req.params.id, data);
        res.status(200).json({ item });
    } catch (err) {
        next(err);
    }
}

export async function getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || env.DEFAULT_PAGE_SIZE;

        const result = await inventoryService.getTransactionHistory(req.params.id, page, limit);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getLowStockItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;
        const items = await inventoryService.getLowStockItems(threshold);
        res.status(200).json({ items, count: items.length });
    } catch (err) {
        next(err);
    }
}

export async function checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const quantity = Number(req.query.quantity);
        if (!quantity || quantity <= 0) {
            return next(new AppError("Valid quantity is required.", 400, "INVALID_QUANTITY"));
        }

        const result = await inventoryService.checkAvailability(req.params.id, quantity);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function bulkCheckAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return next(new AppError("Items array is required.", 400, "INVALID_REQUEST"));
        }

        for (const item of items) {
            if (!item.id || !item.quantity || item.quantity <= 0) {
                return next(new AppError("Each item must have valid id and quantity.", 400, "INVALID_REQUEST"));
            }
        }

        const results = await inventoryService.bulkCheckAvailability(items);
        res.status(200).json({ results });
    } catch (err) {
        next(err);
    }
}
