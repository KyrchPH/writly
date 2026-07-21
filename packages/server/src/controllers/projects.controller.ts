import { ProjectStatus } from "@prisma/client";
import type { RequestHandler, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  normalizeRouteParam,
  optionalTextSchema,
  optionalUrlSchema,
  sendValidationError,
} from "./helpers.js";

const projectQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

const projectBaseSchema = z.object({
  title: z.string().min(2).max(140),
  category: z.string().min(2).max(100),
  description: z.string().min(5).max(5000),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  imageUrl: z.string().url(),
  portraitImageUrl: optionalUrlSchema,
  landscapeImageUrl: optionalUrlSchema,
  previewImages: z.array(z.string().url()).default([]),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.Draft),
  isFeatured: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  timeline: optionalTextSchema(140),
  tags: z.array(z.string().min(1).max(60)).default([]),
  highlights: z.array(z.string().min(1).max(300)).default([]),
  details: optionalTextSchema(8000),
});

const FEATURED_PROJECT_LIMIT = 3;

const projectCreateSchema = projectBaseSchema
  .extend({
    details: z.string().trim().min(1).max(8000),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "End date cannot be earlier than start date.",
    path: ["endDate"],
  });

const optionalNullableUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().url().nullable().optional(),
);

const optionalNullableTextSchema = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().max(max).nullable().optional(),
  );

const optionalDateSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.date().optional(),
);

const optionalNullableDateSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.coerce.date().nullable().optional(),
);

const projectPatchSchema = projectBaseSchema
  .partial()
  .extend({
    imageUrl: optionalNullableUrlSchema,
    portraitImageUrl: optionalNullableUrlSchema,
    landscapeImageUrl: optionalNullableUrlSchema,
    startDate: optionalDateSchema,
    endDate: optionalNullableDateSchema,
    timeline: optionalNullableTextSchema(140),
    details: optionalNullableTextSchema(8000),
  })
  .refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    message: "End date cannot be earlier than start date.",
    path: ["endDate"],
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

const hasFeaturedProjectCapacity = async (excludedProjectId?: string) => {
  const featuredCount = await prisma.project.count({
    where: {
      isFeatured: true,
      ...(excludedProjectId ? { NOT: { id: excludedProjectId } } : {}),
    },
  });

  return featuredCount < FEATURED_PROJECT_LIMIT;
};

const sendFeaturedLimitError = (res: Response) => {
  res.status(400).json({
    message: `Only ${FEATURED_PROJECT_LIMIT} projects can be marked as featured.`,
  });
};

export const listAdminProjects: RequestHandler = async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });
  res.status(200).json({ data: projects });
};

export const getAdminProjectById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  res.status(200).json({ data: project });
};

export const createProject: RequestHandler = async (req, res) => {
  const parsed = projectCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid project payload.", parsed.error);
    return;
  }

  if (parsed.data.isFeatured && !(await hasFeaturedProjectCapacity())) {
    sendFeaturedLimitError(res);
    return;
  }

  const project = await prisma.project.create({ data: parsed.data });
  res.status(201).json({ data: project });
};

export const replaceProject: RequestHandler = async (req, res) => {
  const parsed = projectCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid project payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  if (parsed.data.isFeatured && !(await hasFeaturedProjectCapacity(id))) {
    sendFeaturedLimitError(res);
    return;
  }

  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: project });
};

export const patchProject: RequestHandler = async (req, res) => {
  const parsed = projectPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid project patch payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  if (parsed.data.isFeatured === true && !(await hasFeaturedProjectCapacity(id))) {
    sendFeaturedLimitError(res);
    return;
  }

  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: project });
};

export const deleteProject: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  await prisma.project.delete({ where: { id } });
  res.status(204).send();
};

export const listPublicProjects: RequestHandler = async (req, res) => {
  const parsedQuery = projectQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    sendValidationError(res, "Invalid query parameters.", parsedQuery.error);
    return;
  }

  const search = parsedQuery.data.search?.trim();
  const category = parsedQuery.data.category?.trim();

  const projects = await prisma.project.findMany({
    where: {
      status: ProjectStatus.Published,
      ...(category && category !== "All" ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { tags: { hasSome: [search] } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  res.status(200).json({ data: projects });
};

export const getPublicProjectById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }

  const project = await prisma.project.findFirst({
    where: { id, status: ProjectStatus.Published },
  });
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  res.status(200).json({ data: project });
};
