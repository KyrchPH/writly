import { Router } from "express";
import {
  createBanner,
  deleteBanner,
  getAdminBannerById,
  getPublicBannerById,
  listAdminBanners,
  listPublicBanners,
  patchBanner,
  replaceBanner,
} from "../controllers/banners.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminBannersRouter = Router();
export const publicBannersRouter = Router();

adminBannersRouter.use(requireAuth);
adminBannersRouter.get("/", asyncHandler(listAdminBanners));
adminBannersRouter.get("/all", asyncHandler(listAdminBanners));
adminBannersRouter.get("/:id", asyncHandler(getAdminBannerById));
adminBannersRouter.post("/", asyncHandler(createBanner));
adminBannersRouter.put("/:id", asyncHandler(replaceBanner));
adminBannersRouter.patch("/:id", asyncHandler(patchBanner));
adminBannersRouter.delete("/:id", asyncHandler(deleteBanner));

publicBannersRouter.get("/", asyncHandler(listPublicBanners));
publicBannersRouter.get("/all", asyncHandler(listPublicBanners));
publicBannersRouter.get("/:id", asyncHandler(getPublicBannerById));
