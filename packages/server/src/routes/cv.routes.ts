import { Router } from "express";
import {
  createAdminCvAsset,
  deleteAdminCvAsset,
  downloadCvByToken,
  getAdminCvAsset,
  requestCvOtp,
  setActiveAdminCvAsset,
  verifyCvOtp,
} from "../controllers/cv.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminCvRouter = Router();
export const publicCvRouter = Router();

adminCvRouter.use(requireAuth);
adminCvRouter.get("/", asyncHandler(getAdminCvAsset));
adminCvRouter.post("/", asyncHandler(createAdminCvAsset));
adminCvRouter.put("/", asyncHandler(createAdminCvAsset));
adminCvRouter.patch("/:id/active", asyncHandler(setActiveAdminCvAsset));
adminCvRouter.delete("/:id", asyncHandler(deleteAdminCvAsset));

publicCvRouter.post("/request-otp", asyncHandler(requestCvOtp));
publicCvRouter.post("/verify-otp", asyncHandler(verifyCvOtp));
publicCvRouter.get("/download", asyncHandler(downloadCvByToken));
