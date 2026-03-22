import { z } from "zod";

export const createItemSchema = z.object({
    name: z.string().min(1, "Name is required.").max(200),
    description: z.string().max(2000).optional(),
    category: z.string().min(1, "Category is required.").max(80),
    sku: z.string().min(1, "SKU is required.").max(50),
    price: z.number().min(0, "Price must be non-negative."),
    compareAtPrice: z.number().min(0).optional(),
    stock: z.number().int().min(0, "Stock must be non-negative.").default(0),
    lowStockThreshold: z.number().int().min(0).default(10),
    unit: z.string().min(1, "Unit is required.").max(50),
    images: z.array(z.string().url().max(1024)).max(8).optional(),
    isActive: z.boolean().default(true)
});

export const updateItemSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().min(1).max(80).optional(),
    price: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    unit: z.string().min(1).max(50).optional(),
    images: z.array(z.string().url().max(1024)).max(8).optional(),
    isActive: z.boolean().optional()
});

export const stockUpdateSchema = z.object({
    quantity: z.number().int(),
    type: z.enum(["in", "out", "adjustment"]),
    reason: z.string().max(500).optional(),
    reference: z.string().max(100).optional(),
    notes: z.string().max(1000).optional()
});
