import type { Request, RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { normalizeRouteParam, sendValidationError } from "./helpers.js";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;
const VISITOR_KEY_MAX = 120;

const truncate = (value: string | null | undefined, max: number) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const parseDays = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw ?? DEFAULT_DAYS);
  if (!Number.isFinite(parsed)) return DEFAULT_DAYS;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_DAYS);
};

const toUtcDay = (date: Date) => date.toISOString().slice(0, 10);

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const buildDayKeys = (days: number) => {
  const today = startOfUtcDay(new Date());
  const firstDay = addUtcDays(today, -(days - 1));
  return Array.from({ length: days }, (_, index) => toUtcDay(addUtcDays(firstDay, index)));
};

const getRangeStart = (days: number) => {
  const today = startOfUtcDay(new Date());
  return addUtcDays(today, -(days - 1));
};

const getRequestUrl = (req: Request) => {
  const host = req.get("host");
  if (!host) return req.originalUrl;
  return `${req.protocol}://${host}${req.originalUrl}`;
};

const visitSchema = z.object({
  visitorKey: z.string().trim().min(8).max(VISITOR_KEY_MAX),
  path: z.string().trim().min(1).max(1024).default("/"),
  referrer: z.string().trim().max(2048).optional(),
});

const publicErrorSchema = z.object({
  visitorKey: z.string().trim().min(8).max(VISITOR_KEY_MAX).optional(),
  message: z.string().trim().min(1).max(1000),
  stack: z.string().trim().max(8000).optional(),
  details: z.string().trim().max(4000).optional(),
  path: z.string().trim().max(1024).optional(),
  url: z.string().trim().max(2048).optional(),
});

export const recordPublicVisit: RequestHandler = async (req, res) => {
  const parsed = visitSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid analytics payload.", parsed.error);
    return;
  }

  const now = new Date();
  const userAgent = truncate(req.get("user-agent"), 512);

  try {
    const visitor = await prisma.visitor.upsert({
      where: { visitorKey: parsed.data.visitorKey },
      update: {
        lastSeenAt: now,
        visitCount: { increment: 1 },
      },
      create: {
        visitorKey: parsed.data.visitorKey,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
      },
    });

    await prisma.visitorEvent.create({
      data: {
        visitorId: visitor.id,
        visitorKey: visitor.visitorKey,
        path: parsed.data.path,
        referrer: truncate(parsed.data.referrer, 2048),
        userAgent,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Failed to record public visit.", error);
  }

  res.status(204).send();
};

export const recordPublicErrorLog: RequestHandler = async (req, res) => {
  const parsed = publicErrorSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid error log payload.", parsed.error);
    return;
  }

  try {
    const visitor = parsed.data.visitorKey
      ? await prisma.visitor.findUnique({ where: { visitorKey: parsed.data.visitorKey } })
      : null;

    await prisma.errorLog.create({
      data: {
        source: "frontend",
        message: parsed.data.message,
        stack: truncate(parsed.data.stack, 8000),
        details: truncate(parsed.data.details, 4000),
        path: truncate(parsed.data.path, 1024),
        url: truncate(parsed.data.url, 2048),
        visitorId: visitor?.id,
        visitorKey: parsed.data.visitorKey,
        userAgent: truncate(req.get("user-agent"), 512),
      },
    });
  } catch (error) {
    console.error("Failed to record frontend error log.", error);
  }

  res.status(204).send();
};

export const getAdminAnalytics: RequestHandler = async (req, res) => {
  const days = parseDays(req.query.days);
  const rangeStart = getRangeStart(days);
  const todayStart = startOfUtcDay(new Date());
  const dayKeys = buildDayKeys(days);
  const visitsByDay = new Map(
    dayKeys.map((day) => [day, { date: day, visits: 0, uniqueVisitors: new Set<string>() }]),
  );

  const [totalUniqueVisitors, totalVisits, todayVisits, repeatVisitors, rangeEvents] =
    await Promise.all([
      prisma.visitor.count(),
      prisma.visitorEvent.count(),
      prisma.visitorEvent.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.visitor.count({ where: { visitCount: { gt: 1 } } }),
      prisma.visitorEvent.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true, visitorKey: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  rangeEvents.forEach((event) => {
    const key = toUtcDay(event.createdAt);
    const bucket = visitsByDay.get(key);
    if (!bucket) return;
    bucket.visits += 1;
    bucket.uniqueVisitors.add(event.visitorKey);
  });

  res.status(200).json({
    stats: {
      totalUniqueVisitors,
      totalVisits,
      todayVisits,
      repeatVisitors,
    },
    graph: Array.from(visitsByDay.values()).map((bucket) => ({
      date: bucket.date,
      visits: bucket.visits,
      uniqueVisitors: bucket.uniqueVisitors.size,
    })),
  });
};

export const getAdminErrorLogs: RequestHandler = async (req, res) => {
  const days = parseDays(req.query.days);
  const rangeStart = getRangeStart(days);
  const dayKeys = buildDayKeys(days);
  const errorsByDay = new Map(
    dayKeys.map((day) => [day, { date: day, total: 0, frontend: 0, backend: 0 }]),
  );

  const [openErrors, frontendErrors, backendErrors, latestError, errors, rangeErrors] =
    await Promise.all([
      prisma.errorLog.count(),
      prisma.errorLog.count({ where: { source: "frontend" } }),
      prisma.errorLog.count({ where: { source: "backend" } }),
      prisma.errorLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      prisma.errorLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.errorLog.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true, source: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  rangeErrors.forEach((error) => {
    const key = toUtcDay(error.createdAt);
    const bucket = errorsByDay.get(key);
    if (!bucket) return;
    bucket.total += 1;
    if (error.source === "backend") {
      bucket.backend += 1;
    } else {
      bucket.frontend += 1;
    }
  });

  res.status(200).json({
    stats: {
      openErrors,
      frontendErrors,
      backendErrors,
      latestErrorAt: latestError?.createdAt ?? null,
    },
    graph: Array.from(errorsByDay.values()),
    data: errors,
  });
};

export const deleteAdminErrorLog: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid error log id." });
    return;
  }

  const existing = await prisma.errorLog.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Error log not found." });
    return;
  }

  await prisma.errorLog.delete({ where: { id } });
  res.status(204).send();
};

export const recordBackendError = async (error: unknown, req: Request) => {
  try {
    const err = error instanceof Error ? error : new Error("Unknown backend error");
    await prisma.errorLog.create({
      data: {
        source: "backend",
        message: truncate(err.message, 1000) ?? "Unknown backend error",
        stack: truncate(err.stack, 8000),
        details: truncate(
          JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            params: req.params,
            query: req.query,
          }),
          4000,
        ),
        path: truncate(req.originalUrl, 1024),
        url: truncate(getRequestUrl(req), 2048),
        userAgent: truncate(req.get("user-agent"), 512),
      },
    });
  } catch (loggingError) {
    console.error("Failed to record backend error log", loggingError);
  }
};
