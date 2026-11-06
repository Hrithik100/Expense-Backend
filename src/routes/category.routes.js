
import { Router } from "express";

import {
  listCategories,
  addCategory,
  editCategory,
  removeCategory,
} from "../controllers/category.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listCategories);
router.post("/", addCategory);
router.put("/:id", editCategory);
router.delete("/:id", removeCategory);

export default router;
