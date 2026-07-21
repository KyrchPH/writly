import { Router } from "express";
import {
  createWorkExperience,
  deleteWorkExperience,
  getAdminWorkExperienceById,
  getPublicWorkExperienceById,
  listAdminWorkExperiences,
  listPublicWorkExperiences,
  patchWorkExperience,
  replaceWorkExperience,
} from "../controllers/work-experiences.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminWorkExperiencesRouter = Router();
export const publicWorkExperiencesRouter = Router();

adminWorkExperiencesRouter.use(requireAuth);
adminWorkExperiencesRouter.get("/", asyncHandler(listAdminWorkExperiences));
adminWorkExperiencesRouter.get("/all", asyncHandler(listAdminWorkExperiences));
adminWorkExperiencesRouter.get("/:id", asyncHandler(getAdminWorkExperienceById));
adminWorkExperiencesRouter.post("/", asyncHandler(createWorkExperience));
adminWorkExperiencesRouter.put("/:id", asyncHandler(replaceWorkExperience));
adminWorkExperiencesRouter.patch("/:id", asyncHandler(patchWorkExperience));
adminWorkExperiencesRouter.delete("/:id", asyncHandler(deleteWorkExperience));

publicWorkExperiencesRouter.get("/", asyncHandler(listPublicWorkExperiences));
publicWorkExperiencesRouter.get("/all", asyncHandler(listPublicWorkExperiences));
publicWorkExperiencesRouter.get("/:id", asyncHandler(getPublicWorkExperienceById));
