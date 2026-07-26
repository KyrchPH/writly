import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProd } from "./config/env.js";
import { db, ensureDatabaseIndexes } from "./lib/db.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminContractsRouter, publicContractsRouter } from "./routes/contracts.routes.js";
import { adminUploadsRouter, publicFilesRouter } from "./routes/uploads.routes.js";

const app = express();
app.set("trust proxy", true);
app.set("etag", "strong");

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
app.use("/api/admin/contracts", adminContractsRouter);
app.use("/api/admin/uploads", adminUploadsRouter);
app.use("/api/public/contracts", publicContractsRouter);
app.use("/api/public/files", publicFilesRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
});

void ensureDatabaseIndexes().catch((error) => {
  console.error("Failed to ensure MongoDB indexes.", error);
});

const shutdown = async () => {
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
