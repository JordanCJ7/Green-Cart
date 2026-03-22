import { Request, Response, NextFunction } from "express";
import { supplierService } from "../services/supplier.service";

// Utility function to parse categories
function parseCategories(categories: unknown): string[] {
    if (Array.isArray(categories)) {
        return categories.filter((c): c is string => typeof c === 'string').map(c => c.trim()).filter(Boolean);
    }
    if (typeof categories === 'string') {
        return categories.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
}

export async function getAllSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const suppliers = await supplierService.getAll();
        res.status(200).json({ suppliers });
    } catch (err) {
        next(err);
    }
}

export async function getSupplierStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const stats = await supplierService.getStats();
        res.status(200).json(stats);
    } catch (err) {
        next(err);
    }
}

export async function getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const supplier = await supplierService.getById(req.params.id);
        res.status(200).json({ supplier });
    } catch (err) {
        next(err);
    }
}

export async function createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name, contact, phone, categories, notes } = req.body;
        const catArray = parseCategories(categories);

        const supplier = await supplierService.create({ name, contact, phone, categories: catArray, notes });
        res.status(201).json({ supplier });
    } catch (err) {
        next(err);
    }
}

export async function updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = { ...req.body };
        if (data.categories !== undefined) {
            data.categories = parseCategories(data.categories);
        }
        const supplier = await supplierService.update(req.params.id, data);
        res.status(200).json({ supplier });
    } catch (err) {
        next(err);
    }
}

export async function deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await supplierService.delete(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
