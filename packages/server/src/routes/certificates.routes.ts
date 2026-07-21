import { Router } from "express";
import {
  createCertificate,
  deleteCertificate,
  getAdminCertificateById,
  getPublicCertificateById,
  listAdminCertificates,
  listPublicCertificates,
  patchCertificate,
  replaceCertificate,
} from "../controllers/certificates.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminCertificatesRouter = Router();
export const publicCertificatesRouter = Router();

adminCertificatesRouter.use(requireAuth);
adminCertificatesRouter.get("/", asyncHandler(listAdminCertificates));
adminCertificatesRouter.get("/all", asyncHandler(listAdminCertificates));
adminCertificatesRouter.get("/:id", asyncHandler(getAdminCertificateById));
adminCertificatesRouter.post("/", asyncHandler(createCertificate));
adminCertificatesRouter.put("/:id", asyncHandler(replaceCertificate));
adminCertificatesRouter.patch("/:id", asyncHandler(patchCertificate));
adminCertificatesRouter.delete("/:id", asyncHandler(deleteCertificate));

publicCertificatesRouter.get("/", asyncHandler(listPublicCertificates));
publicCertificatesRouter.get("/all", asyncHandler(listPublicCertificates));
publicCertificatesRouter.get("/:id", asyncHandler(getPublicCertificateById));
