import { Router } from "express";
import {
  createService,
  deleteService,
  getAdminServiceById,
  getPublicServiceById,
  listAdminServices,
  listPublicServices,
  patchService,
  replaceService,
} from "../controllers/services.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminServicesRouter = Router();
export const publicServicesRouter = Router();

adminServicesRouter.use(requireAuth);
adminServicesRouter.get("/", asyncHandler(listAdminServices));
adminServicesRouter.get("/all", asyncHandler(listAdminServices));
adminServicesRouter.get("/:id", asyncHandler(getAdminServiceById));
adminServicesRouter.post("/", asyncHandler(createService));
adminServicesRouter.put("/:id", asyncHandler(replaceService));
adminServicesRouter.patch("/:id", asyncHandler(patchService));
adminServicesRouter.delete("/:id", asyncHandler(deleteService));

publicServicesRouter.get("/", asyncHandler(listPublicServices));
publicServicesRouter.get("/all", asyncHandler(listPublicServices));
publicServicesRouter.get("/:id", asyncHandler(getPublicServiceById));
