import { Router } from "express";
import {
    getAllSuppliers,
    getSupplierById,
    getSupplierStats,
    createSupplier,
    updateSupplier,
    deleteSupplier
} from "../controllers/supplier.controller";
import { authenticate, requireAdmin } from "../middleware/authenticate";

const router = Router();

router.get("/stats", getSupplierStats);
router.get("/", getAllSuppliers);
router.get("/:id", getSupplierById);
router.post("/", authenticate, requireAdmin, createSupplier);
router.put("/:id", authenticate, requireAdmin, updateSupplier);
router.delete("/:id", authenticate, requireAdmin, deleteSupplier);

export default router;
