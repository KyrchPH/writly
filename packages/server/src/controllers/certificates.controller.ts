import type { RequestHandler } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import {
  normalizeRouteParam,
  optionalUrlSchema,
  sendValidationError,
} from "./helpers.js";

const certificateCreateSchema = z.object({
  org: z.string().min(2).max(200),
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(5000),
  issueDate: z.coerce.date(),
  imageUrl: optionalUrlSchema,
});

const certificatePatchSchema = certificateCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

export const listAdminCertificates: RequestHandler = async (_req, res) => {
  const certificates = await db.certificate.findMany({
    orderBy: { issueDate: "desc" },
  });
  res.status(200).json({ data: certificates });
};

export const getAdminCertificateById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid certificate id." });
    return;
  }

  const certificate = await db.certificate.findUnique({ where: { id } });
  if (!certificate) {
    res.status(404).json({ message: "Certificate not found." });
    return;
  }

  res.status(200).json({ data: certificate });
};

export const createCertificate: RequestHandler = async (req, res) => {
  const parsed = certificateCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid certificate payload.", parsed.error);
    return;
  }

  const certificate = await db.certificate.create({ data: parsed.data });
  res.status(201).json({ data: certificate });
};

export const replaceCertificate: RequestHandler = async (req, res) => {
  const parsed = certificateCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid certificate payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid certificate id." });
    return;
  }

  const existing = await db.certificate.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Certificate not found." });
    return;
  }

  const certificate = await db.certificate.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: certificate });
};

export const patchCertificate: RequestHandler = async (req, res) => {
  const parsed = certificatePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid certificate patch payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid certificate id." });
    return;
  }

  const existing = await db.certificate.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Certificate not found." });
    return;
  }

  const certificate = await db.certificate.update({
    where: { id },
    data: parsed.data,
  });
  res.status(200).json({ data: certificate });
};

export const deleteCertificate: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid certificate id." });
    return;
  }

  const existing = await db.certificate.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Certificate not found." });
    return;
  }

  await db.certificate.delete({ where: { id } });
  res.status(204).send();
};

export const listPublicCertificates: RequestHandler = async (_req, res) => {
  const certificates = await db.certificate.findMany({
    orderBy: { issueDate: "desc" },
  });
  res.status(200).json({ data: certificates });
};

export const getPublicCertificateById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid certificate id." });
    return;
  }

  const certificate = await db.certificate.findUnique({ where: { id } });
  if (!certificate) {
    res.status(404).json({ message: "Certificate not found." });
    return;
  }

  res.status(200).json({ data: certificate });
};
