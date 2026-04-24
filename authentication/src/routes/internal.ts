import { Router } from "express";
import { internalAuth } from "../middleware/internalAuth";
import { getUserByIdInternal } from "../controllers/internal.controller";

const router = Router();

router.use(internalAuth);

router.get("/users/:id", getUserByIdInternal);

export default router;
