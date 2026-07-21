import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { sendContractEmail } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";
import { normalizeRouteParam, sendValidationError } from "./helpers.js";

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email().max(320).optional(),
);

const pdfDocumentSchema = z.object({
  filePath: z.string().trim().min(1).max(1024),
  fileUrl: z.string().trim().url().max(2048),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(3).max(120).default("application/pdf"),
});

const contractFieldSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.enum(["text", "textbox", "signature", "image", "draw"]),
  page: z.coerce.number().int().min(1).max(200),
  x: z.coerce.number().min(0).max(1),
  y: z.coerce.number().min(0).max(1),
  width: z.coerce.number().min(0.03).max(1),
  height: z.coerce.number().min(0.015).max(1),
  objectLabel: z.string().trim().max(160).default(""),
  label: z.string().trim().max(1000).default(""),
  fontFamily: z.string().trim().min(1).max(120).default("Arial"),
  fontStyle: z.enum(["regular", "bold", "italic", "boldItalic"]).default("regular"),
  fontColor: z.string().trim().min(1).max(40).default("#111827"),
  backgroundColor: z.string().trim().min(1).max(40).default("transparent"),
  borderColor: z.string().trim().min(1).max(40).default("#111827"),
  borderWidth: z.coerce.number().min(0).max(12).default(0),
  textAlign: z.enum(["left", "center", "right", "justify"]).default("left"),
  imageUrl: z.string().trim().max(2048).default(""),
  drawingDataUrl: z.string().trim().max(1_100_000).default(""),
  drawColor: z.string().trim().min(1).max(40).default("#111827"),
  drawStrokeWidth: z.coerce.number().min(1).max(16).default(4),
  fontSize: z.coerce.number().min(8).max(36).default(14),
  required: z.boolean().default(false),
  locked: z.boolean().default(false),
});

const contractTemplateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  title: z.string().trim().min(2).max(220),
  pdfDocument: pdfDocumentSchema,
  pageCount: z.coerce.number().int().min(1).max(200).default(1),
  fields: z.array(contractFieldSchema).min(1).max(200),
});

const createContractSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().trim().max(220).optional(),
  recipientName: z.string().trim().min(2).max(180),
  recipientEmail: optionalEmailSchema,
});

const submitContractSchema = z.object({
  values: z.record(z.string().trim().max(1_100_000)).default({}),
});

const tokenSchema = z
  .string()
  .trim()
  .min(40)
  .max(240)
  .regex(/^[0-9a-fA-F-]{36}\.[A-Za-z0-9_-]+$/, "Invalid contract token.");

type ContractField = z.infer<typeof contractFieldSchema>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeFields = (fields: ContractField[]) =>
  fields.map((field) => {
    const width = clamp(field.width, 0.03, 1);
    const height = clamp(field.height, 0.015, 1);
    return {
      ...field,
      x: clamp(field.x, 0, 1 - width),
      y: clamp(field.y, 0, 1 - height),
      width,
      height,
      objectLabel: field.objectLabel.trim(),
      label: field.label.trim(),
      fontFamily: field.fontFamily.trim() || "Arial",
      fontStyle: field.fontStyle,
      fontColor: field.fontColor.trim() || "#111827",
      backgroundColor: field.backgroundColor.trim() || "transparent",
      borderColor: field.borderColor.trim() || "#111827",
      borderWidth: clamp(field.borderWidth, 0, 12),
      imageUrl: field.imageUrl.trim(),
      drawingDataUrl: field.drawingDataUrl.trim(),
      drawColor: field.drawColor.trim() || "#111827",
      drawStrokeWidth: clamp(field.drawStrokeWidth, 1, 16),
      fontSize: clamp(field.fontSize, 8, 36),
      required:
        field.type === "signature" && (field.imageUrl.trim() || field.drawingDataUrl.trim())
          ? false
          : field.required,
    };
  });

const parseStoredFields = (value: unknown): ContractField[] => {
  const parsed = z.array(contractFieldSchema).safeParse(value);
  return parsed.success ? normalizeFields(parsed.data) : [];
};

const parseStoredValues = (value: unknown) => {
  const parsed = z.record(z.string()).safeParse(value);
  return parsed.success ? parsed.data : {};
};

const basePublicUrl = () => env.PUBLIC_APP_URL.replace(/\/+$/, "");

const signContractId = (id: string) =>
  createHmac("sha256", env.JWT_SECRET).update(`contract:${id}`).digest("base64url");

const isMatchingSignature = (expected: string, received: string) => {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

const createContractToken = (id: string) => `${id}.${signContractId(id)}`;

const getContractIdFromToken = (token: string) => {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return null;

  const [id, signature] = parsed.data.split(".");
  const expectedSignature = signContractId(id);
  return isMatchingSignature(expectedSignature, signature) ? id : null;
};

const buildContractUrl = (id: string) =>
  `${basePublicUrl()}/contracts/${encodeURIComponent(createContractToken(id))}`;

const serializeTemplate = (template: {
  id: string;
  name: string;
  title: string;
  pdfFilePath: string;
  pdfFileUrl: string;
  pdfFileName: string;
  pdfMimeType: string;
  pageCount: number;
  fields: unknown;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    contracts: number;
  };
}) => ({
  id: template.id,
  name: template.name,
  title: template.title,
  pdfDocument: {
    filePath: template.pdfFilePath,
    fileUrl: template.pdfFileUrl,
    fileName: template.pdfFileName,
    mimeType: template.pdfMimeType,
  },
  pageCount: template.pageCount,
  fields: parseStoredFields(template.fields),
  contractCount: template._count?.contracts ?? 0,
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
});

const serializeContract = (contract: {
  id: string;
  templateId: string | null;
  title: string;
  recipientName: string;
  recipientEmail: string | null;
  pdfFilePath: string;
  pdfFileUrl: string;
  pdfFileName: string;
  pdfMimeType: string;
  pageCount: number;
  fields: unknown;
  values: unknown;
  sentAt: Date | null;
  viewedAt: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  template?: {
    id: string;
    name: string;
  } | null;
}) => ({
  id: contract.id,
  templateId: contract.templateId,
  title: contract.title,
  recipientName: contract.recipientName,
  recipientEmail: contract.recipientEmail,
  pdfDocument: {
    filePath: contract.pdfFilePath,
    fileUrl: contract.pdfFileUrl,
    fileName: contract.pdfFileName,
    mimeType: contract.pdfMimeType,
  },
  pageCount: contract.pageCount,
  fields: parseStoredFields(contract.fields),
  values: parseStoredValues(contract.values),
  contractUrl: buildContractUrl(contract.id),
  sentAt: contract.sentAt,
  viewedAt: contract.viewedAt,
  submittedAt: contract.submittedAt,
  createdAt: contract.createdAt,
  updatedAt: contract.updatedAt,
  template: contract.template
    ? {
        id: contract.template.id,
        name: contract.template.name,
      }
    : null,
});

const listTemplates = () =>
  prisma.contractTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { contracts: true },
      },
    },
  });

const listContracts = () =>
  prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

export const listAdminContracts: RequestHandler = async (_req, res) => {
  const [templates, contracts] = await Promise.all([listTemplates(), listContracts()]);

  res.status(200).json({
    templates: templates.map(serializeTemplate),
    contracts: contracts.map(serializeContract),
  });
};

export const createAdminContractTemplate: RequestHandler = async (req, res) => {
  const parsed = contractTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid contract template payload.", parsed.error);
    return;
  }

  const fields = normalizeFields(parsed.data.fields);
  const template = await prisma.contractTemplate.create({
    data: {
      name: parsed.data.name,
      title: parsed.data.title,
      pdfFilePath: parsed.data.pdfDocument.filePath,
      pdfFileUrl: parsed.data.pdfDocument.fileUrl,
      pdfFileName: parsed.data.pdfDocument.fileName,
      pdfMimeType: parsed.data.pdfDocument.mimeType,
      pageCount: parsed.data.pageCount,
      fields,
    },
    include: {
      _count: {
        select: { contracts: true },
      },
    },
  });

  res.status(201).json({ data: serializeTemplate(template) });
};

export const deleteAdminContractTemplate: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid contract template id." });
    return;
  }

  const existing = await prisma.contractTemplate.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Contract template not found." });
    return;
  }

  await prisma.contractTemplate.delete({ where: { id } });
  res.status(204).send();
};

export const createAdminContract: RequestHandler = async (req, res) => {
  const parsed = createContractSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid contract payload.", parsed.error);
    return;
  }

  const template = await prisma.contractTemplate.findUnique({
    where: { id: parsed.data.templateId },
  });

  if (!template) {
    res.status(404).json({ message: "Contract template not found." });
    return;
  }

  const contract = await prisma.contract.create({
    data: {
      templateId: template.id,
      title: parsed.data.title?.trim() || template.title,
      recipientName: parsed.data.recipientName,
      recipientEmail: parsed.data.recipientEmail,
      pdfFilePath: template.pdfFilePath,
      pdfFileUrl: template.pdfFileUrl,
      pdfFileName: template.pdfFileName,
      pdfMimeType: template.pdfMimeType,
      pageCount: template.pageCount,
      fields: parseStoredFields(template.fields),
      values: {},
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(201).json({ data: serializeContract(contract) });
};

export const sendAdminContractEmail: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid contract id." });
    return;
  }

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (!contract) {
    res.status(404).json({ message: "Contract not found." });
    return;
  }

  if (!contract.recipientEmail) {
    res.status(400).json({
      message: "Add a recipient email before sending this contract.",
    });
    return;
  }

  const contractUrl = buildContractUrl(contract.id);
  try {
    await sendContractEmail({
      to: contract.recipientEmail,
      recipientName: contract.recipientName,
      contractTitle: contract.title,
      contractUrl,
    });
  } catch (error) {
    res.status(202).json({
      data: serializeContract(contract),
      emailDelivery: {
        status: "failed",
        message:
          error instanceof Error ? error.message : "Failed to send contract email.",
      },
    });
    return;
  }

  const updatedContract = await prisma.contract.update({
    where: { id },
    data: { sentAt: new Date() },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(200).json({
    data: serializeContract(updatedContract),
    emailDelivery: {
      status: "sent",
    },
  });
};

export const deleteAdminContract: RequestHandler = async (req, res) => {
  const id = normalizeRouteParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid contract id." });
    return;
  }

  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Contract not found." });
    return;
  }

  await prisma.contract.delete({ where: { id } });
  res.status(204).send();
};

export const getPublicContract: RequestHandler = async (req, res) => {
  const token = normalizeRouteParam(req.params.token);
  const id = token ? getContractIdFromToken(token) : null;
  if (!id) {
    res.status(404).json({ message: "Contract link unavailable." });
    return;
  }

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    res.status(404).json({ message: "Contract link unavailable." });
    return;
  }

  const viewedAt = contract.viewedAt ?? new Date();
  if (!contract.viewedAt) {
    await prisma.contract.update({
      where: { id },
      data: { viewedAt },
    });
  }

  res.status(200).json({
    data: {
      id: contract.id,
      title: contract.title,
      recipientName: contract.recipientName,
      pdfDocument: {
        fileUrl: contract.pdfFileUrl,
        fileName: contract.pdfFileName,
        mimeType: contract.pdfMimeType,
      },
      pageCount: contract.pageCount,
      fields: parseStoredFields(contract.fields),
      values: parseStoredValues(contract.values),
      sentAt: contract.sentAt,
      viewedAt,
      submittedAt: contract.submittedAt,
      createdAt: contract.createdAt,
    },
  });
};

export const submitPublicContract: RequestHandler = async (req, res) => {
  const token = normalizeRouteParam(req.params.token);
  const id = token ? getContractIdFromToken(token) : null;
  if (!id) {
    res.status(404).json({ message: "Contract link unavailable." });
    return;
  }

  const parsed = submitContractSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid contract field values.", parsed.error);
    return;
  }

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    res.status(404).json({ message: "Contract link unavailable." });
    return;
  }

  const fields = parseStoredFields(contract.fields);
  const fillableFields = fields.filter(
    (field) =>
      field.type === "textbox" ||
      (field.type === "signature" && !field.imageUrl.trim() && !field.drawingDataUrl.trim()),
  );
  const fillableIds = new Set(fillableFields.map((field) => field.id));
  const values = Object.fromEntries(
    Object.entries(parsed.data.values)
      .filter(([key]) => fillableIds.has(key))
      .map(([key, value]) => [key, value.trim()]),
  );

  const invalidSignatureField = fillableFields.find((field) => {
    if (field.type !== "signature") return false;
    const value = values[field.id]?.trim();
    return Boolean(value && !value.startsWith("data:image/png;base64,"));
  });
  if (invalidSignatureField) {
    res.status(400).json({
      message: `Please upload or draw a valid PNG signature for "${
        invalidSignatureField.label || "signature"
      }".`,
    });
    return;
  }

  const missingRequiredField = fillableFields.find(
    (field) => field.required && !values[field.id]?.trim(),
  );
  if (missingRequiredField) {
    res.status(400).json({
      message: `Please complete "${missingRequiredField.label || "required field"}".`,
    });
    return;
  }

  const updatedContract = await prisma.contract.update({
    where: { id },
    data: {
      values,
      submittedAt: new Date(),
      viewedAt: contract.viewedAt ?? new Date(),
    },
  });

  res.status(200).json({
    data: {
      id: updatedContract.id,
      values: parseStoredValues(updatedContract.values),
      submittedAt: updatedContract.submittedAt,
    },
  });
};
