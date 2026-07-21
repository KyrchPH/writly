import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  normalizeRouteParam,
  optionalUrlSchema,
  sendValidationError,
} from "./helpers.js";

const workExperienceCreateSchema = z.object({
  company: z.string().trim().min(2).max(180),
  role: z.string().trim().min(2).max(180),
  duration: z.string().trim().min(2).max(140),
  location: z.string().trim().min(2).max(180),
  summary: z.string().trim().min(5).max(5000),
  imageUrl: optionalUrlSchema,
  highlights: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

const workExperiencePatchSchema = workExperienceCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

export const listAdminWorkExperiences: RequestHandler = async (_req, res) => {
  const workExperiences = await prisma.workExperience.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  res.status(200).json({ data: workExperiences });
};

export const getAdminWorkExperienceById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid work experience id." });
    return;
  }

  const workExperience = await prisma.workExperience.findUnique({ where: { id } });
  if (!workExperience) {
    res.status(404).json({ message: "Work experience not found." });
    return;
  }

  res.status(200).json({ data: workExperience });
};

export const createWorkExperience: RequestHandler = async (req, res) => {
  const parsed = workExperienceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid work experience payload.", parsed.error);
    return;
  }

  const workExperience = await prisma.workExperience.create({ data: parsed.data });
  res.status(201).json({ data: workExperience });
};

export const replaceWorkExperience: RequestHandler = async (req, res) => {
  const parsed = workExperienceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid work experience payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid work experience id." });
    return;
  }

  const existing = await prisma.workExperience.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Work experience not found." });
    return;
  }

  const workExperience = await prisma.workExperience.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: workExperience });
};

export const patchWorkExperience: RequestHandler = async (req, res) => {
  const parsed = workExperiencePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid work experience patch payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid work experience id." });
    return;
  }

  const existing = await prisma.workExperience.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Work experience not found." });
    return;
  }

  const workExperience = await prisma.workExperience.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: workExperience });
};

export const deleteWorkExperience: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid work experience id." });
    return;
  }

  const existing = await prisma.workExperience.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Work experience not found." });
    return;
  }

  await prisma.workExperience.delete({ where: { id } });
  res.status(204).send();
};

export const listPublicWorkExperiences: RequestHandler = async (_req, res) => {
  const workExperiences = await prisma.workExperience.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  res.status(200).json({ data: workExperiences });
};

export const getPublicWorkExperienceById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid work experience id." });
    return;
  }

  const workExperience = await prisma.workExperience.findFirst({
    where: { id, isPublished: true },
  });
  if (!workExperience) {
    res.status(404).json({ message: "Work experience not found." });
    return;
  }

  res.status(200).json({ data: workExperience });
};
