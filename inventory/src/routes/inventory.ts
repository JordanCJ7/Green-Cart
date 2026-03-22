import { Router } from "express";
import {
    createItem,
    getAllItems,
    getItemById,
    getItemBySku,
    updateItem,
    deleteItem,
    updateStock,
    getTransactionHistory,
    getLowStockItems,
    checkAvailability,
    bulkCheckAvailability
} from "../controllers/inventory.controller";
import { authenticate, requireAdmin } from "../middleware/authenticate";

const router = Router();

router.post("/", authenticate, requireAdmin, createItem);
router.get("/", getAllItems);
router.get("/low-stock", authenticate, getLowStockItems);
router.get("/sku/:sku", getItemBySku);
router.get("/:id", getItemById);
router.put("/:id", authenticate, requireAdmin, updateItem);
router.delete("/:id", authenticate, requireAdmin, deleteItem);
router.patch("/:id/stock", authenticate, requireAdmin, updateStock);
router.get("/:id/transactions", authenticate, getTransactionHistory);
router.get("/:id/availability", checkAvailability);
router.post("/bulk-check-availability", bulkCheckAvailability);

export default router;
