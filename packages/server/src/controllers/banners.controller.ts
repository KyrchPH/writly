import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  normalizeRouteParam,
  optionalUrlSchema,
  sendValidationError,
} from "./helpers.js";

const bannerCreateSchema = z.object({
  title: z.string().trim().min(2).max(180),
  subtitle: z.string().trim().min(3).max(5000),
  imageUrl: optionalUrlSchema,
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

const bannerPatchSchema = bannerCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

export const listAdminBanners: RequestHandler = async (_req, res) => {
  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  res.status(200).json({ data: banners });
};

export const getAdminBannerById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid banner id." });
    return;
  }

  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) {
    res.status(404).json({ message: "Banner not found." });
    return;
  }

  res.status(200).json({ data: banner });
};

export const createBanner: RequestHandler = async (req, res) => {
  const parsed = bannerCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid banner payload.", parsed.error);
    return;
  }

  const banner = await prisma.banner.create({ data: parsed.data });
  res.status(201).json({ data: banner });
};

export const replaceBanner: RequestHandler = async (req, res) => {
  const parsed = bannerCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid banner payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid banner id." });
    return;
  }

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Banner not found." });
    return;
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: banner });
};

export const patchBanner: RequestHandler = async (req, res) => {
  const parsed = bannerPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid banner patch payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid banner id." });
    return;
  }

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Banner not found." });
    return;
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: banner });
};

export const deleteBanner: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid banner id." });
    return;
  }

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Banner not found." });
    return;
  }

  await prisma.banner.delete({ where: { id } });
  res.status(204).send();
};

export const listPublicBanners: RequestHandler = async (_req, res) => {
  const banners = await prisma.banner.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  res.status(200).json({ data: banners });
};

export const getPublicBannerById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid banner id." });
    return;
  }

  const banner = await prisma.banner.findFirst({
    where: { id, isPublished: true },
  });
  if (!banner) {
    res.status(404).json({ message: "Banner not found." });
    return;
  }

  res.status(200).json({ data: banner });
};
