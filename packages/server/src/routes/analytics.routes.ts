import { Router } from "express";
import {
  deleteAdminErrorLog,
  getAdminAnalytics,
  getAdminErrorLogs,
  recordPublicErrorLog,
  recordPublicVisit,
} from "../controllers/analytics.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const publicAnalyticsRouter = Router();
export const publicErrorLogsRouter = Router();
export const adminAnalyticsRouter = Router();
export const adminErrorLogsRouter = Router();

publicAnalyticsRouter.post("/visit", asyncHandler(recordPublicVisit));
publicErrorLogsRouter.post("/", asyncHandler(recordPublicErrorLog));

adminAnalyticsRouter.use(requireAuth);
adminAnalyticsRouter.get("/", asyncHandler(getAdminAnalytics));

adminErrorLogsRouter.use(requireAuth);
adminErrorLogsRouter.get("/", asyncHandler(getAdminErrorLogs));
adminErrorLogsRouter.delete("/:id", asyncHandler(deleteAdminErrorLog));
