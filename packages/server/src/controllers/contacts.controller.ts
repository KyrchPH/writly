import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { optionalTextSchema, optionalUrlSchema, sendValidationError } from "./helpers.js";

const CONTACT_CONFIG_ID = "primary";

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().email().max(320).optional(),
);

const contactConfigUpsertSchema = z.object({
  email: optionalEmailSchema,
  phone: optionalTextSchema(60),
  instagramUrl: optionalUrlSchema,
  whatsappUrl: optionalUrlSchema,
  telegramUrl: optionalUrlSchema,
  linkedinUrl: optionalUrlSchema,
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(true),
  showInstagram: z.boolean().default(true),
  showWhatsapp: z.boolean().default(true),
  showTelegram: z.boolean().default(true),
  showLinkedin: z.boolean().default(true),
});

export const getAdminContactConfig: RequestHandler = async (_req, res) => {
  const config = await prisma.contactConfig.findUnique({
    where: { id: CONTACT_CONFIG_ID },
  });
  res.status(200).json({ data: config });
};

export const upsertAdminContactConfig: RequestHandler = async (req, res) => {
  const parsed = contactConfigUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid contact config payload.", parsed.error);
    return;
  }

  const config = await prisma.contactConfig.upsert({
    where: { id: CONTACT_CONFIG_ID },
    create: {
      id: CONTACT_CONFIG_ID,
      ...parsed.data,
    },
    update: parsed.data,
  });

  res.status(200).json({ data: config });
};

export const getPublicContactConfig: RequestHandler = async (_req, res) => {
  const config = await prisma.contactConfig.findUnique({
    where: { id: CONTACT_CONFIG_ID },
  });
  if (!config) {
    res.status(200).json({ data: null });
    return;
  }

  res.status(200).json({
    data: {
      ...config,
      email: config.showEmail ? config.email : null,
      phone: config.showPhone ? config.phone : null,
      instagramUrl: config.showInstagram ? config.instagramUrl : null,
      whatsappUrl: config.showWhatsapp ? config.whatsappUrl : null,
      telegramUrl: config.showTelegram ? config.telegramUrl : null,
      linkedinUrl: config.showLinkedin ? config.linkedinUrl : null,
    },
  });
};
