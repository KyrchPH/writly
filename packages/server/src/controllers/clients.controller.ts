import { createHash, randomBytes } from "node:crypto";
import type { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { sendReviewInvitationEmail } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";
import {
  normalizeRouteParam,
  optionalTextSchema,
  optionalUrlSchema,
  sendValidationError,
} from "./helpers.js";

const clientSchema = z.object({
  name: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(320),
  imageUrl: optionalUrlSchema,
  company: optionalTextSchema(180),
  role: optionalTextSchema(180),
  notes: optionalTextSchema(3000),
});

const clientPatchSchema = clientSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashReviewInvitationToken = (token: string) =>
  createHash("sha256").update(`${token}:${env.JWT_SECRET}`).digest("hex");

const createInvitationToken = () => randomBytes(32).toString("hex");

const getInvitationExpiry = () =>
  new Date(Date.now() + env.REVIEW_INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

const buildReviewUrl = (token: string) =>
  `${env.PUBLIC_APP_URL.replace(/\/+$/, "")}/review/${token}`;

export const cleanupExpiredReviewInvitations = async () => {
  await prisma.reviewInvitation.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
};

const serializeClient = (client: {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  invitations?: Array<{
    id: string;
    sentAt: Date;
    expiresAt: Date;
    createdAt: Date;
  }>;
  _count?: {
    reviews: number;
  };
}) => {
  const invitation = client.invitations?.[0] ?? null;
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    imageUrl: client.imageUrl,
    company: client.company,
    role: client.role,
    notes: client.notes,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    reviewCount: client._count?.reviews ?? 0,
    invitation: invitation
      ? {
          id: invitation.id,
          sentAt: invitation.sentAt,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          isExpired: invitation.expiresAt.getTime() <= Date.now(),
        }
      : null,
  };
};

const getClientWithInvitation = async (id: string) =>
  prisma.client.findUnique({
    where: { id },
    include: {
      invitations: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
      _count: {
        select: { reviews: true },
      },
    },
  });

export const listAdminClients: RequestHandler = async (_req, res) => {
  await cleanupExpiredReviewInvitations();
  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      invitations: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
      _count: {
        select: { reviews: true },
      },
    },
  });

  res.status(200).json({ data: clients.map(serializeClient) });
};

export const getAdminClientById: RequestHandler = async (req, res) => {
  await cleanupExpiredReviewInvitations();
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid client id." });
    return;
  }

  const client = await getClientWithInvitation(id);
  if (!client) {
    res.status(404).json({ message: "Client not found." });
    return;
  }

  res.status(200).json({ data: serializeClient(client) });
};

export const createAdminClient: RequestHandler = async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid client payload.", parsed.error);
    return;
  }

  try {
    const client = await prisma.client.create({
      data: {
        ...parsed.data,
        email: normalizeEmail(parsed.data.email),
      },
      include: {
        invitations: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    res.status(201).json({ data: serializeClient(client) });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "A client with this email already exists." });
      return;
    }
    throw error;
  }
};

export const patchAdminClient: RequestHandler = async (req, res) => {
  const parsed = clientPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid client patch payload.", parsed.error);
    return;
  }

  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid client id." });
    return;
  }

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Client not found." });
    return;
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...parsed.data,
        email: parsed.data.email ? normalizeEmail(parsed.data.email) : undefined,
      },
      include: {
        invitations: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    res.status(200).json({ data: serializeClient(client) });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "A client with this email already exists." });
      return;
    }
    throw error;
  }
};

export const deleteAdminClient: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid client id." });
    return;
  }

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Client not found." });
    return;
  }

  await prisma.client.delete({ where: { id } });
  res.status(204).send();
};

export const sendAdminClientReviewInvitation: RequestHandler = async (req, res) => {
  await cleanupExpiredReviewInvitations();
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid client id." });
    return;
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    res.status(404).json({ message: "Client not found." });
    return;
  }

  const token = createInvitationToken();
  const tokenHash = hashReviewInvitationToken(token);
  const expiresAt = getInvitationExpiry();
  const reviewUrl = buildReviewUrl(token);

  const invitation = await prisma.$transaction(async (tx) => {
    await tx.reviewInvitation.deleteMany({ where: { clientId: id } });
    return tx.reviewInvitation.create({
      data: {
        clientId: id,
        tokenHash,
        expiresAt,
      },
    });
  });

  try {
    await sendReviewInvitationEmail({
      to: client.email,
      clientName: client.name,
      reviewUrl,
      expiresInDays: env.REVIEW_INVITATION_EXPIRY_DAYS,
    });
  } catch (error) {
    const refreshedClient = await getClientWithInvitation(id);
    res.status(202).json({
      data: refreshedClient ? serializeClient(refreshedClient) : null,
      invitation: {
        id: invitation.id,
        sentAt: invitation.sentAt,
        expiresAt: invitation.expiresAt,
        reviewUrl,
      },
      emailDelivery: {
        status: "failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send review invitation email.",
      },
    });
    return;
  }

  const refreshedClient = await getClientWithInvitation(id);
  res.status(200).json({
    data: refreshedClient ? serializeClient(refreshedClient) : null,
    invitation: {
      id: invitation.id,
      sentAt: invitation.sentAt,
      expiresAt: invitation.expiresAt,
      reviewUrl,
    },
    emailDelivery: {
      status: "sent",
    },
  });
};

export const getReviewInvitationByToken = async (token: string) => {
  await cleanupExpiredReviewInvitations();
  const tokenHash = hashReviewInvitationToken(token);
  return prisma.reviewInvitation.findUnique({
    where: { tokenHash },
    include: { client: true },
  });
};
