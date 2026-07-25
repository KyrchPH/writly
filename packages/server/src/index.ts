import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProd } from "./config/env.js";
import { recordBackendError } from "./controllers/analytics.controller.js";
import { db, ensureDatabaseIndexes } from "./lib/db.js";
import { authRouter } from "./routes/auth.routes.js";
import {
  adminAnalyticsRouter,
  adminErrorLogsRouter,
  publicAnalyticsRouter,
  publicErrorLogsRouter,
} from "./routes/analytics.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { adminBannersRouter, publicBannersRouter } from "./routes/banners.routes.js";
import { adminCertificatesRouter, publicCertificatesRouter } from "./routes/certificates.routes.js";
import { adminContactsRouter, publicContactsRouter } from "./routes/contacts.routes.js";
import { adminContractsRouter, publicContractsRouter } from "./routes/contracts.routes.js";
import { adminCvRouter, publicCvRouter } from "./routes/cv.routes.js";
import { adminClientsRouter } from "./routes/clients.routes.js";
import { cronRouter } from "./routes/cron.routes.js";
import { cleanupExpiredReviewInvitations } from "./controllers/clients.controller.js";
import { adminDashboardRouter } from "./routes/dashboard.routes.js";
import { adminProjectsRouter, publicProjectsRouter } from "./routes/projects.routes.js";
import {
  adminReviewsRouter,
  publicReviewInvitationsRouter,
  publicReviewsRouter,
} from "./routes/reviews.routes.js";
import { adminServicesRouter, publicServicesRouter } from "./routes/services.routes.js";
import { adminUploadsRouter, publicFilesRouter } from "./routes/uploads.routes.js";
import {
  adminWorkExperiencesRouter,
  publicWorkExperiencesRouter,
} from "./routes/work-experiences.routes.js";

const app = express();
app.set("trust proxy", true);
app.set("etag", "strong");
const REVIEW_INVITATION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    exposedHeaders: ["ETag"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(isProd ? "combined" : "dev"));

app.use("/api/admin", (req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "private, no-cache");
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    check: "liveness",
    service: "writly-server",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/ready", async (_req, res) => {
  let database: "up" | "down" = "up";
  try {
    await db.$ping();
  } catch {
    database = "down";
  }

  const isReady = database === "up";
  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ok" : "degraded",
    check: "readiness",
    service: "writly-server",
    checks: {
      database,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/projects", adminProjectsRouter);
app.use("/api/admin/services", adminServicesRouter);
app.use("/api/admin/banners", adminBannersRouter);
app.use("/api/admin/work-experiences", adminWorkExperiencesRouter);
app.use("/api/admin/certificates", adminCertificatesRouter);
app.use("/api/admin/reviews", adminReviewsRouter);
app.use("/api/admin/clients", adminClientsRouter);
app.use("/api/admin/contracts", adminContractsRouter);
app.use("/api/admin/users", usersRouter);
app.use("/api/admin/contacts", adminContactsRouter);
app.use("/api/admin/cv", adminCvRouter);
app.use("/api/admin/uploads", adminUploadsRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/admin/error-logs", adminErrorLogsRouter);

app.use("/api/public/projects", publicProjectsRouter);
app.use("/api/public/services", publicServicesRouter);
app.use("/api/public/banners", publicBannersRouter);
app.use("/api/public/work-experiences", publicWorkExperiencesRouter);
app.use("/api/public/certificates", publicCertificatesRouter);
app.use("/api/public/reviews", publicReviewsRouter);
app.use("/api/public/review-invitations", publicReviewInvitationsRouter);
app.use("/api/public/contacts", publicContactsRouter);
app.use("/api/public/contracts", publicContractsRouter);
app.use("/api/public/cv", publicCvRouter);
app.use("/api/public/files", publicFilesRouter);
app.use("/api/public/analytics", publicAnalyticsRouter);
app.use("/api/public/error-logs", publicErrorLogsRouter);
app.use("/api/cron", cronRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  void recordBackendError(err, req);
  res.status(500).json({ message: "Internal server error." });
});

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
});

void ensureDatabaseIndexes().catch((error) => {
  console.error("Failed to ensure MongoDB indexes.", error);
});

const reviewInvitationCleanupTimer = setInterval(() => {
  void cleanupExpiredReviewInvitations().catch((error) => {
    console.error("Failed to clean expired review invitations.", error);
  });
}, REVIEW_INVITATION_CLEANUP_INTERVAL_MS);
reviewInvitationCleanupTimer.unref();
void cleanupExpiredReviewInvitations().catch((error) => {
  console.error("Failed to clean expired review invitations on startup.", error);
});

const shutdown = async () => {
  clearInterval(reviewInvitationCleanupTimer);
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
