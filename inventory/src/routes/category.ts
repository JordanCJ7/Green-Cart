import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory
} from "../controllers/category.controller";
import { authenticate, requireAdmin } from "../middleware/authenticate";

const router = Router();

router.post("/", authenticate, requireAdmin, createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.get("/slug/:slug", getCategoryBySlug);
router.put("/:id", authenticate, requireAdmin, updateCategory);
router.delete("/:id", authenticate, requireAdmin, deleteCategory);

export default router;
