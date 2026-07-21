import { Router } from "express";
import {
  approveReview,
  deleteReview,
  getAdminReviewById,
  getPublicReviewById,
  getPublicReviewInvitation,
  listAdminReviews,
  listPublicReviews,
  patchReview,
  replaceReview,
  submitPublicReviewInvitation,
} from "../controllers/reviews.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminReviewsRouter = Router();
export const publicReviewsRouter = Router();
export const publicReviewInvitationsRouter = Router();

adminReviewsRouter.use(requireAuth);
adminReviewsRouter.get("/", asyncHandler(listAdminReviews));
adminReviewsRouter.get("/all", asyncHandler(listAdminReviews));
adminReviewsRouter.get("/:id", asyncHandler(getAdminReviewById));
adminReviewsRouter.put("/:id", asyncHandler(replaceReview));
adminReviewsRouter.patch("/:id", asyncHandler(patchReview));
adminReviewsRouter.patch("/:id/approve", asyncHandler(approveReview));
adminReviewsRouter.delete("/:id", asyncHandler(deleteReview));

publicReviewsRouter.get("/", asyncHandler(listPublicReviews));
publicReviewsRouter.get("/all", asyncHandler(listPublicReviews));
publicReviewsRouter.get("/:id", asyncHandler(getPublicReviewById));

publicReviewInvitationsRouter.get("/:token", asyncHandler(getPublicReviewInvitation));
publicReviewInvitationsRouter.post("/:token/submit", asyncHandler(submitPublicReviewInvitation));
