import { Router, type NextFunction, type Request, type Response } from "express";
import { env } from "../config/env.js";
import { db } from "../lib/db.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const cronRouter = Router();

const getCronSecretFromRequest = (req: Request) => {
  const authorization = req.get("authorization")?.trim();
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return req.get("x-cron-secret")?.trim() ?? "";
};

const requireCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const expectedSecret = env.CRON_KEEPALIVE_SECRET?.trim();
  if (!expectedSecret) {
    next();
    return;
  }

  if (getCronSecretFromRequest(req) !== expectedSecret) {
    res.status(401).json({ message: "Unauthorized cron request." });
    return;
  }

  next();
};

cronRouter.get(
  ["/mongodb-keepalive", "/database-keepalive"],
  requireCronSecret,
  asyncHandler(async (_req, res) => {
    const startedAt = Date.now();
    const timestamp = new Date().toISOString();

    res.setHeader("Cache-Control", "no-store, max-age=0");

    try {
      await db.$ping();
    } catch {
      res.status(503).json({
        status: "degraded",
        check: "mongodb-keepalive",
        database: "down",
        timestamp,
      });
      return;
    }

    res.status(200).json({
      status: "ok",
      check: "mongodb-keepalive",
      database: "up",
      latencyMs: Date.now() - startedAt,
      timestamp,
    });
  }),
);
