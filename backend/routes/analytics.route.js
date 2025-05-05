import express from "express";
import {} from "../controllers/cart.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { fetchAnalytics } from "../controllers/analytics.controller.js";
const router = express.Router();
router.get("/", protectRoute, adminRoute, fetchAnalytics);
export default router;
