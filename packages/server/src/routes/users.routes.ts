import { Router } from "express";
import {
  approveUser,
  listPendingUsers,
  rejectUser,
} from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get("/pending", asyncHandler(listPendingUsers));
usersRouter.patch("/:id/approve", asyncHandler(approveUser));
usersRouter.delete("/:id/reject", asyncHandler(rejectUser));
