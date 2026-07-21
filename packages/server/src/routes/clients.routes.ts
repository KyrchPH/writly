import { Router } from "express";
import {
  createAdminClient,
  deleteAdminClient,
  getAdminClientById,
  listAdminClients,
  patchAdminClient,
  sendAdminClientReviewInvitation,
} from "../controllers/clients.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminClientsRouter = Router();

adminClientsRouter.use(requireAuth);
adminClientsRouter.get("/", asyncHandler(listAdminClients));
adminClientsRouter.get("/all", asyncHandler(listAdminClients));
adminClientsRouter.get("/:id", asyncHandler(getAdminClientById));
adminClientsRouter.post("/", asyncHandler(createAdminClient));
adminClientsRouter.patch("/:id", asyncHandler(patchAdminClient));
adminClientsRouter.delete("/:id", asyncHandler(deleteAdminClient));
adminClientsRouter.post("/:id/invitations", asyncHandler(sendAdminClientReviewInvitation));
