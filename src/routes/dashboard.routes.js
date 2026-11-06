import { Router } from "express";

import { dashboard } from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, dashboard);

export default router;