import mongoose from "mongoose";
import { Category, ICategory } from "../models/Category";
import { InventoryItem } from "../models/InventoryItem";
import { AppError } from "../errors/AppError";

export interface CreateCategoryData {
    name: string;
    description?: string;
    icon?: string;
    slug: string;
    isActive?: boolean;
}

export interface UpdateCategoryData {
    name?: string;
    description?: string;
    icon?: string;
    slug?: string;
    isActive?: boolean;
}

class CategoryService {
    async createCategory(data: CreateCategoryData): Promise<ICategory> {
        const category = await Category.create(data);
        return category;
    }

    async getAllCategories(activeOnly: boolean = false) {
        const query = activeOnly ? { isActive: true } : {};
        const categories = await Category.find(query).sort({ name: 1 }).lean();
        return categories;
    }

    async getCategoryById(id: string): Promise<ICategory> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid category ID.", 400, "INVALID_ID");
        }

        const category = await Category.findById(id);
        if (!category) {
            throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");
        }

        return category;
    }

    async getCategoryBySlug(slug: string): Promise<ICategory> {
        const category = await Category.findOne({ slug: slug.toLowerCase() });
        if (!category) {
            throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");
        }

        return category;
    }

    async updateCategory(id: string, data: UpdateCategoryData): Promise<ICategory> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid category ID.", 400, "INVALID_ID");
        }

        const category = await Category.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!category) {
            throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");
        }

        return category;
    }

    async deleteCategory(id: string): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid category ID.", 400, "INVALID_ID");
        }

        const itemsCount = await InventoryItem.countDocuments({ category: id });
        if (itemsCount > 0) {
            throw new AppError(
                `Cannot delete category with ${itemsCount} associated items.`,
                400,
                "CATEGORY_IN_USE"
            );
        }

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");
        }
    }
}

export const categoryService = new CategoryService();
