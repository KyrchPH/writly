import type { RequestHandler } from "express";
import { z } from "zod";
import {
  cleanupExpiredReviewInvitations,
  hashReviewInvitationToken,
} from "./clients.controller.js";
import { prisma } from "../lib/prisma.js";
import {
  normalizeRouteParam,
  optionalTextSchema,
  sendValidationError,
} from "./helpers.js";

const reviewContentSchema = z.object({
  name: z.string().trim().min(2).max(140),
  role: optionalTextSchema(180),
  rating: z.number().int().min(1).max(5),
  avatar: optionalTextSchema(10),
  feedback: z.string().trim().min(3).max(1200),
  detail: optionalTextSchema(5000),
});

const reviewPatchSchema = reviewContentSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

const publicReviewSubmissionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().trim().min(3).max(1200),
  detail: optionalTextSchema(5000),
});

const tokenSchema = z
  .string()
  .trim()
  .min(32)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid review invitation token.");

const serializeReview = (review: {
  id: string;
  clientId: string | null;
  name: string;
  role: string | null;
  rating: number;
  avatar: string | null;
  feedback: string;
  detail: string | null;
  status: "Pending" | "Approved";
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  client?: {
    id: string;
    email: string;
    company: string | null;
  } | null;
}) => ({
  id: review.id,
  clientId: review.clientId,
  clientEmail: review.client?.email ?? null,
  clientCompany: review.client?.company ?? null,
  name: review.name,
  role: review.role,
  rating: review.rating,
  avatar: review.avatar,
  feedback: review.feedback,
  detail: review.detail,
  status: review.status,
  isPublished: review.isPublished,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

export const listAdminReviews: RequestHandler = async (_req, res) => {
  const reviews = await prisma.review.findMany({
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    include: {
      client: {
        select: {
          id: true,
          email: true,
          company: true,
        },
      },
    },
  });
  res.status(200).json({ data: reviews.map(serializeReview) });
};

export const getAdminReviewById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid review id." });
    return;
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          company: true,
        },
      },
    },
  });
  if (!review) {
    res.status(404).json({ message: "Review not found." });
    return;
  }

  res.status(200).json({ data: serializeReview(review) });
};

export const replaceReview: RequestHandler = async (req, res) => {
  const parsed = reviewContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid review payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid review id." });
    return;
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Review not found." });
    return;
  }

  const review = await prisma.review.update({
    where: { id },
    data: parsed.data,
    include: {
      client: {
        select: {
          id: true,
          email: true,
          company: true,
        },
      },
    },
  });
  res.status(200).json({ data: serializeReview(review) });
};

export const patchReview: RequestHandler = async (req, res) => {
  const parsed = reviewPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid review patch payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid review id." });
    return;
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Review not found." });
    return;
  }

  const review = await prisma.review.update({
    where: { id },
    data: parsed.data,
    include: {
      client: {
        select: {
          id: true,
          email: true,
          company: true,
        },
      },
    },
  });
  res.status(200).json({ data: serializeReview(review) });
};

export const approveReview: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid review id." });
    return;
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Review not found." });
    return;
  }

  const review = await prisma.review.update({
    where: { id },
    data: {
      status: "Approved",
      isPublished: true,
    },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          company: true,
        },
      },
    },
  });

  res.status(200).json({ data: serializeReview(review) });
};

export const deleteReview: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid review id." });
    return;
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Review not found." });
    return;
  }

  await prisma.review.delete({ where: { id } });
  res.status(204).send();
};

export const listPublicReviews: RequestHandler = async (_req, res) => {
  const reviews = await prisma.review.findMany({
    where: {
      status: "Approved",
      isPublished: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  res.status(200).json({ data: reviews.map(serializeReview) });
};

export const getPublicReviewById: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid review id." });
    return;
  }

  const review = await prisma.review.findFirst({
    where: {
      id,
      status: "Approved",
      isPublished: true,
    },
  });
  if (!review) {
    res.status(404).json({ message: "Review not found." });
    return;
  }

  res.status(200).json({ data: serializeReview(review) });
};

export const getPublicReviewInvitation: RequestHandler = async (req, res) => {
  await cleanupExpiredReviewInvitations();
  const token = normalizeRouteParam(req.params.token);
  const parsedToken = tokenSchema.safeParse(token);
  if (!parsedToken.success) {
    res.status(400).json({ message: "Invalid review invitation link." });
    return;
  }

  const invitation = await prisma.reviewInvitation.findUnique({
    where: { tokenHash: hashReviewInvitationToken(parsedToken.data) },
    include: { client: true },
  });

  if (!invitation) {
    res.status(404).json({ message: "Review invitation is expired or already used." });
    return;
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    await prisma.reviewInvitation.delete({ where: { id: invitation.id } }).catch(() => {
      // The link is already unusable; cleanup can be retried later.
    });
    res.status(410).json({ message: "Review invitation has expired." });
    return;
  }

  res.status(200).json({
    data: {
      clientName: invitation.client.name,
      company: invitation.client.company,
      role: invitation.client.role,
      expiresAt: invitation.expiresAt,
    },
  });
};

export const submitPublicReviewInvitation: RequestHandler = async (req, res) => {
  const token = normalizeRouteParam(req.params.token);
  const parsedToken = tokenSchema.safeParse(token);
  if (!parsedToken.success) {
    res.status(400).json({ message: "Invalid review invitation link." });
    return;
  }

  const parsed = publicReviewSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid review submission payload.", parsed.error);
    return;
  }

  const tokenHash = hashReviewInvitationToken(parsedToken.data);
  const invitation = await prisma.reviewInvitation.findUnique({
    where: { tokenHash },
    include: { client: true },
  });

  if (!invitation) {
    res.status(404).json({ message: "Review invitation is expired or already used." });
    return;
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    await prisma.reviewInvitation.delete({ where: { id: invitation.id } }).catch(() => {
      // The link is already unusable; cleanup can be retried later.
    });
    res.status(410).json({ message: "Review invitation has expired." });
    return;
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const lockedInvitation = await tx.reviewInvitation.findUnique({
        where: { tokenHash },
        include: { client: true },
      });
      if (!lockedInvitation || lockedInvitation.expiresAt.getTime() <= Date.now()) {
        throw new Error("INVITATION_UNAVAILABLE");
      }

      await tx.reviewInvitation.delete({ where: { id: lockedInvitation.id } });
      return tx.review.create({
        data: {
          clientId: lockedInvitation.clientId,
          name: lockedInvitation.client.name,
          role: lockedInvitation.client.role || lockedInvitation.client.company,
          rating: parsed.data.rating,
          feedback: parsed.data.feedback,
          detail: parsed.data.detail,
          status: "Pending",
          isPublished: false,
        },
      });
    });

    res.status(201).json({
      data: serializeReview(review),
      message: "Review submitted and waiting for approval.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_UNAVAILABLE") {
      res.status(409).json({ message: "This review invitation can no longer be used." });
      return;
    }
    throw error;
  }
};
