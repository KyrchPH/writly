import { Router } from "express";
import {
  createAdminContract,
  createAdminContractTemplate,
  deleteAdminContract,
  deleteAdminContractTemplate,
  getPublicContract,
  listAdminContracts,
  sendAdminContractEmail,
  submitPublicContract,
} from "../controllers/contracts.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminContractsRouter = Router();
export const publicContractsRouter = Router();

adminContractsRouter.use(requireAuth);
adminContractsRouter.get("/", asyncHandler(listAdminContracts));
adminContractsRouter.get("/all", asyncHandler(listAdminContracts));
adminContractsRouter.post("/templates", asyncHandler(createAdminContractTemplate));
adminContractsRouter.delete("/templates/:id", asyncHandler(deleteAdminContractTemplate));
adminContractsRouter.post("/", asyncHandler(createAdminContract));
adminContractsRouter.post("/:id/send", asyncHandler(sendAdminContractEmail));
adminContractsRouter.delete("/:id", asyncHandler(deleteAdminContract));

publicContractsRouter.get("/:token", asyncHandler(getPublicContract));
publicContractsRouter.post("/:token/submit", asyncHandler(submitPublicContract));
