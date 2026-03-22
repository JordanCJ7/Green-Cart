import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { AppError } from "../errors/AppError";
import { createCategorySchema, updateCategorySchema } from "../validation/inventorySchemas";

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = createCategorySchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map(e => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const category = await categoryService.createCategory(parseResult.data);
        res.status(201).json({ category });
    } catch (err) {
        next(err);
    }
}

export async function getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const activeOnly = req.query.activeOnly === "true";
        const categories = await categoryService.getAllCategories(activeOnly);
        res.status(200).json({ categories, count: categories.length });
    } catch (err) {
        next(err);
    }
}

export async function getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        res.status(200).json({ category });
    } catch (err) {
        next(err);
    }
}

export async function getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const category = await categoryService.getCategoryBySlug(req.params.slug);
        res.status(200).json({ category });
    } catch (err) {
        next(err);
    }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parseResult = updateCategorySchema.safeParse(req.body);
        if (!parseResult.success) {
            const messages = parseResult.error.errors.map(e => e.message).join(" ");
            return next(new AppError(messages, 422, "VALIDATION_ERROR"));
        }

        const category = await categoryService.updateCategory(req.params.id, parseResult.data);
        res.status(200).json({ category });
    } catch (err) {
        next(err);
    }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
