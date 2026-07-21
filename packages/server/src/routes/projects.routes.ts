import { Router } from "express";
import {
  createProject,
  deleteProject,
  getAdminProjectById,
  getPublicProjectById,
  listAdminProjects,
  listPublicProjects,
  patchProject,
  replaceProject,
} from "../controllers/projects.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminProjectsRouter = Router();
export const publicProjectsRouter = Router();

adminProjectsRouter.use(requireAuth);
adminProjectsRouter.get("/", asyncHandler(listAdminProjects));
adminProjectsRouter.get("/all", asyncHandler(listAdminProjects));
adminProjectsRouter.get("/:id", asyncHandler(getAdminProjectById));
adminProjectsRouter.post("/", asyncHandler(createProject));
adminProjectsRouter.put("/:id", asyncHandler(replaceProject));
adminProjectsRouter.patch("/:id", asyncHandler(patchProject));
adminProjectsRouter.delete("/:id", asyncHandler(deleteProject));

publicProjectsRouter.get("/", asyncHandler(listPublicProjects));
publicProjectsRouter.get("/all", asyncHandler(listPublicProjects));
publicProjectsRouter.get("/:id", asyncHandler(getPublicProjectById));
