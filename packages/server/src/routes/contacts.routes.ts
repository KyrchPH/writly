import { Router } from "express";
import {
  getAdminContactConfig,
  getPublicContactConfig,
  upsertAdminContactConfig,
} from "../controllers/contacts.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminContactsRouter = Router();
export const publicContactsRouter = Router();

adminContactsRouter.use(requireAuth);
adminContactsRouter.get("/", asyncHandler(getAdminContactConfig));
adminContactsRouter.put("/", asyncHandler(upsertAdminContactConfig));

publicContactsRouter.get("/", asyncHandler(getPublicContactConfig));
