import { Router } from "express";
import {
  approveAdminUser,
  listPendingAdminUsers,
  rejectAdminUser,
} from "../controllers/admin-users.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth);
adminUsersRouter.get("/pending", asyncHandler(listPendingAdminUsers));
adminUsersRouter.patch("/:id/approve", asyncHandler(approveAdminUser));
adminUsersRouter.delete("/:id/reject", asyncHandler(rejectAdminUser));
