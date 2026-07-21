import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAuth);
adminDashboardRouter.get("/stats", asyncHandler(getDashboardStats));
