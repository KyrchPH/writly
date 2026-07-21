import { Router, raw } from "express";
import { env } from "../config/env.js";
import {
  deleteUploadedFile,
  getProxyFileUrl,
  signReadUrl,
  signUploadUrl,
  streamFileByProxyPath,
  testUploadStorageAccess,
  uploadFile,
} from "../controllers/uploads.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const adminUploadsRouter = Router();
export const publicFilesRouter = Router();

const frameAncestorOrigins = Array.from(
  new Set(
    [
      "'self'",
      ...env.CORS_ORIGINS,
      env.PUBLIC_APP_URL,
      env.ADMIN_APP_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://view.officeapps.live.com",
      "https://*.officeapps.live.com",
    ]
      .map((origin) => {
        if (origin === "'self'" || origin.includes("*")) return origin;
        try {
          return new URL(origin).origin;
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  ),
);

adminUploadsRouter.use(requireAuth);
adminUploadsRouter.get("/test", asyncHandler(testUploadStorageAccess));
adminUploadsRouter.post("/file", raw({ type: "*/*", limit: "25mb" }), asyncHandler(uploadFile));
adminUploadsRouter.post("/sign", asyncHandler(signUploadUrl));
adminUploadsRouter.post("/proxy-url", asyncHandler(getProxyFileUrl));
adminUploadsRouter.post("/read-url", asyncHandler(signReadUrl));
adminUploadsRouter.delete("/", asyncHandler(deleteUploadedFile));

publicFilesRouter.use((_req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; frame-ancestors ${frameAncestorOrigins.join(" ")};`,
  );
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

publicFilesRouter.get("/:encodedPath", asyncHandler(streamFileByProxyPath));
