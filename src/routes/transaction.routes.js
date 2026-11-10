import { Router } from "express";

import {
  create,
  dailyExpenses,
  list,
  remove,
  update,
} from "../controllers/transaction.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);
router.get("/daily-expenses", requireAuth, dailyExpenses);

export default router;