import { Router } from "express";

import {
  getBudgets,
  setBudget,
} from "../controllers/transaction.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getBudgets);
router.put("/:categoryId", requireAuth, setBudget);

export default router;