import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  normalizeRouteParam,
  optionalTextSchema,
  optionalUrlSchema,
  sendValidationError,
} from "./helpers.js";

const serviceCreateSchema = z.object({
  name: z.string().min(2).max(140),
  subtitle: optionalTextSchema(220),
  description: z.string().min(5).max(5000),
  imageUrl: optionalUrlSchema,
  price: optionalTextSchema(100),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

const servicePatchSchema = serviceCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

export const listAdminServices: RequestHandler = async (_req, res) => {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  res.status(200).json({ data: services });
};

export const getAdminServiceById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id." });
    return;
  }

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    res.status(404).json({ message: "Service not found." });
    return;
  }

  res.status(200).json({ data: service });
};

export const createService: RequestHandler = async (req, res) => {
  const parsed = serviceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid service payload.", parsed.error);
    return;
  }

  const service = await prisma.service.create({ data: parsed.data });
  res.status(201).json({ data: service });
};

export const replaceService: RequestHandler = async (req, res) => {
  const parsed = serviceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid service payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id." });
    return;
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Service not found." });
    return;
  }

  const service = await prisma.service.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: service });
};

export const patchService: RequestHandler = async (req, res) => {
  const parsed = servicePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid service patch payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id." });
    return;
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Service not found." });
    return;
  }

  const service = await prisma.service.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: service });
};

export const deleteService: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id." });
    return;
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Service not found." });
    return;
  }

  await prisma.service.delete({ where: { id } });
  res.status(204).send();
};

export const listPublicServices: RequestHandler = async (_req, res) => {
  const services = await prisma.service.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  res.status(200).json({ data: services });
};

export const getPublicServiceById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id." });
    return;
  }

  const service = await prisma.service.findFirst({
    where: { id, isPublished: true },
  });
  if (!service) {
    res.status(404).json({ message: "Service not found." });
    return;
  }

  res.status(200).json({ data: service });
};
