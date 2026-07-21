import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { getFirebaseStorageBucket } from "../lib/firebase-storage.js";
import { sendCvOtpEmail } from "../lib/mailer.js";
import { db } from "../lib/db.js";
import { signCvDownloadToken, verifyCvDownloadToken } from "../utils/jwt.js";
import { sendValidationError } from "./helpers.js";

const OTP_LENGTH = 6;
const OTP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const allowedCvExtensions = [".pdf", ".docx"] as const;
const allowedCvMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const isAllowedCvFile = (fileName: string, mimeType: string) => {
  const normalizedName = fileName.trim().toLowerCase();
  const normalizedMime = mimeType.trim().toLowerCase();
  return (
    allowedCvMimeTypes.has(normalizedMime) ||
    allowedCvExtensions.some((extension) => normalizedName.endsWith(extension))
  );
};

const cvDocumentTypeSchema = z.enum(["ATS", "Visual"]);

const cvDocumentSchema = z
  .object({
    filePath: z.string().min(1).max(1024),
    fileUrl: z.string().url().max(2048),
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(3).max(120).default("application/pdf"),
  })
  .refine((value) => isAllowedCvFile(value.fileName, value.mimeType), {
    message: "CV file must be a PDF or DOCX document.",
    path: ["fileName"],
  });

const createCvSchema = z
  .object({
    atsDocument: cvDocumentSchema,
    visualDocument: cvDocumentSchema,
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.atsDocument.filePath !== value.visualDocument.filePath ||
      value.atsDocument.fileName !== value.visualDocument.fileName,
    {
      message: "ATS and Visual CV documents must be uploaded separately.",
      path: ["visualDocument"],
    },
  );

const cvAssetIdSchema = z.object({
  id: z.string().min(1).max(200),
});

const requestOtpSchema = z.object({
  email: z.string().email().max(320),
  documentType: cvDocumentTypeSchema,
});

const verifyOtpSchema = z.object({
  email: z.string().email().max(320),
  documentType: cvDocumentTypeSchema,
  otp: z
    .string()
    .trim()
    .min(OTP_LENGTH)
    .max(OTP_LENGTH)
    .regex(/^[A-Za-z0-9]{6}$/, "OTP must be 6 alphanumeric characters."),
});

const downloadQuerySchema = z.object({
  token: z.string().min(20).max(4000),
});

const getApiBaseUrl = (req: Request) => {
  const host = req.get("x-forwarded-host") ?? req.get("host");
  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() || req.protocol;
  return `${protocol}://${host}`;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const generateOtp = () => {
  const bytes = randomBytes(OTP_LENGTH);
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    otp += OTP_ALPHABET[bytes[i] % OTP_ALPHABET.length];
  }
  return otp;
};

const hashOtp = (email: string, otp: string) =>
  createHash("sha256")
    .update(`${normalizeEmail(email)}:${otp.toUpperCase()}:${env.JWT_SECRET}`)
    .digest("hex");

const compareOtpHash = (leftHash: string, rightHash: string) => {
  const left = Buffer.from(leftHash, "hex");
  const right = Buffer.from(rightHash, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

const sanitizeFileName = (name: string) => name.replace(/["\r\n]/g, "_");

const streamFileToResponse = async (
  filePath: string,
  res: Response,
) => {
  const bucket = getFirebaseStorageBucket();
  const file = bucket.file(filePath);
  await new Promise<void>((resolve, reject) => {
    const stream = file.createReadStream();
    stream.on("error", reject);
    stream.on("end", resolve);
    stream.pipe(res);
  });
};

const isNotFoundError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: number; statusCode?: number };
  return err.code === 404 || err.statusCode === 404;
};

type CvAssetDocument = {
  filePath: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
};

type CvAssetWithDocuments = {
  filePath: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  atsFilePath: string;
  atsFileUrl: string;
  atsFileName: string;
  atsMimeType: string;
  visualFilePath: string;
  visualFileUrl: string;
  visualFileName: string;
  visualMimeType: string;
};

const getCvDocument = (
  cvAsset: CvAssetWithDocuments,
  documentType: z.infer<typeof cvDocumentTypeSchema>,
): CvAssetDocument =>
  documentType === "ATS"
    ? {
        filePath: cvAsset.atsFilePath || cvAsset.filePath,
        fileUrl: cvAsset.atsFileUrl || cvAsset.fileUrl,
        fileName: cvAsset.atsFileName || cvAsset.fileName,
        mimeType: cvAsset.atsMimeType || cvAsset.mimeType,
      }
    : {
        filePath: cvAsset.visualFilePath || cvAsset.filePath,
        fileUrl: cvAsset.visualFileUrl || cvAsset.fileUrl,
        fileName: cvAsset.visualFileName || cvAsset.fileName,
        mimeType: cvAsset.visualMimeType || cvAsset.mimeType,
      };

export const getAdminCvAsset: RequestHandler = async (_req, res) => {
  const cvAssets = await db.cvAsset.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: {
        select: {
          downloads: true,
        },
      },
      downloads: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          email: true,
          documentType: true,
          createdAt: true,
        },
      },
    },
  });
  const formattedCvAssets = cvAssets.map(({ _count, downloads, ...asset }: any) => ({
    ...asset,
    downloadCount: _count.downloads,
    downloads,
  }));
  res.status(200).json({
    data: formattedCvAssets,
    active: formattedCvAssets.find((asset: any) => asset.isActive) ?? null,
  });
};

export const createAdminCvAsset: RequestHandler = async (req, res) => {
  const parsed = createCvSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid CV payload.", parsed.error);
    return;
  }

  const hasActiveCv = await db.cvAsset.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  const shouldActivate = parsed.data.isActive ?? !hasActiveCv;
  const statusUpdatedAt = new Date();

  const saved = await db.$transaction(async (tx: any) => {
    if (shouldActivate) {
      await tx.cvAsset.updateMany({
        where: { isActive: true },
        data: { isActive: false, statusUpdatedAt },
      });
    }

    return tx.cvAsset.create({
      data: {
        filePath: parsed.data.visualDocument.filePath,
        fileUrl: parsed.data.visualDocument.fileUrl,
        fileName: parsed.data.visualDocument.fileName,
        mimeType: parsed.data.visualDocument.mimeType,
        atsFilePath: parsed.data.atsDocument.filePath,
        atsFileUrl: parsed.data.atsDocument.fileUrl,
        atsFileName: parsed.data.atsDocument.fileName,
        atsMimeType: parsed.data.atsDocument.mimeType,
        visualFilePath: parsed.data.visualDocument.filePath,
        visualFileUrl: parsed.data.visualDocument.fileUrl,
        visualFileName: parsed.data.visualDocument.fileName,
        visualMimeType: parsed.data.visualDocument.mimeType,
        isActive: shouldActivate,
        statusUpdatedAt,
      },
    });
  });

  res.status(201).json({ data: saved });
};

export const setActiveAdminCvAsset: RequestHandler = async (req, res) => {
  const parsed = cvAssetIdSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, "Invalid CV id.", parsed.error);
    return;
  }

  const existing = await db.cvAsset.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) {
    res.status(404).json({ message: "CV not found." });
    return;
  }

  const statusUpdatedAt = new Date();
  const saved = await db.$transaction(async (tx: any) => {
    await tx.cvAsset.updateMany({
      where: { isActive: true },
      data: { isActive: false, statusUpdatedAt },
    });
    return tx.cvAsset.update({
      where: { id: parsed.data.id },
      data: { isActive: true, statusUpdatedAt },
    });
  });

  res.status(200).json({ data: saved });
};

export const deleteAdminCvAsset: RequestHandler = async (req, res) => {
  const parsed = cvAssetIdSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, "Invalid CV id.", parsed.error);
    return;
  }

  const existing = await db.cvAsset.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) {
    res.status(404).json({ message: "CV not found." });
    return;
  }

  await db.cvAsset.delete({ where: { id: existing.id } });
  try {
    const bucket = getFirebaseStorageBucket();
    const paths = new Set([
      existing.filePath,
      existing.atsFilePath,
      existing.visualFilePath,
    ].filter(Boolean));
    await Promise.all(
      Array.from(paths).map((filePath) =>
        bucket.file(filePath).delete({ ignoreNotFound: true }),
      ),
    );
  } catch {
    // Deleting the DB record is the source of truth; storage cleanup can be retried manually.
  }

  if (existing.isActive) {
    const nextAsset = await db.cvAsset.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    if (nextAsset) {
      await db.cvAsset.update({
        where: { id: nextAsset.id },
        data: { isActive: true, statusUpdatedAt: new Date() },
      });
    }
  }

  res.status(204).send();
};

export const requestCvOtp: RequestHandler = async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid OTP request payload.", parsed.error);
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const documentType = parsed.data.documentType;
  const now = new Date();

  const cvAsset = await db.cvAsset.findFirst({
    where: { isActive: true },
  });
  if (!cvAsset) {
    res.status(404).json({ message: "CV is currently unavailable." });
    return;
  }
  const requestedDocument = getCvDocument(cvAsset, documentType);
  if (!requestedDocument.filePath) {
    res.status(404).json({ message: `${documentType} CV is currently unavailable.` });
    return;
  }

  const latestPending = await db.cvOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (latestPending) {
    const elapsedSeconds = Math.floor(
      (now.getTime() - latestPending.createdAt.getTime()) / 1000,
    );
    const retryAfterSeconds =
      env.CV_OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
    if (retryAfterSeconds > 0) {
      res.status(429).json({
        message: "Please wait before requesting another OTP.",
        retryAfterSeconds,
      });
      return;
    }
  }

  const otp = generateOtp();
  const otpHash = hashOtp(email, otp);
  const expiresAt = new Date(
    now.getTime() + env.CV_OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  const record = await db.cvOtp.create({
    data: {
      email,
      otpHash,
      expiresAt,
    },
  });

  try {
    await sendCvOtpEmail({
      to: email,
      otp,
      expiresInMinutes: env.CV_OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    await db.cvOtp.delete({ where: { id: record.id } }).catch(() => undefined);
    const message =
      error instanceof Error ? error.message : "Failed to send OTP email.";
    res.status(500).json({ message });
    return;
  }

  res.status(200).json({
    data: {
      sent: true,
      email,
      expiresAt: expiresAt.toISOString(),
      resendAvailableInSeconds: env.CV_OTP_RESEND_COOLDOWN_SECONDS,
    },
  });
};

export const verifyCvOtp: RequestHandler = async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid OTP verification payload.", parsed.error);
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const documentType = parsed.data.documentType;
  const otpInput = parsed.data.otp.trim().toUpperCase();
  const now = new Date();

  const latestPending = await db.cvOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!latestPending) {
    res.status(400).json({ message: "Invalid or expired OTP." });
    return;
  }

  if (latestPending.expiresAt.getTime() < now.getTime()) {
    await db.cvOtp.update({
      where: { id: latestPending.id },
      data: { consumedAt: now },
    });
    res.status(400).json({ message: "OTP has expired. Request a new one." });
    return;
  }

  if (latestPending.attempts >= 5) {
    await db.cvOtp.update({
      where: { id: latestPending.id },
      data: { consumedAt: now },
    });
    res.status(429).json({ message: "Too many invalid attempts. Request a new OTP." });
    return;
  }

  const expectedHash = hashOtp(email, otpInput);
  const matched = compareOtpHash(expectedHash, latestPending.otpHash);
  if (!matched) {
    const nextAttempts = latestPending.attempts + 1;
    await db.cvOtp.update({
      where: { id: latestPending.id },
      data: {
        attempts: nextAttempts,
        ...(nextAttempts >= 5 ? { consumedAt: now } : {}),
      },
    });
    res.status(400).json({ message: "Invalid OTP." });
    return;
  }

  await db.cvOtp.update({
    where: { id: latestPending.id },
    data: { consumedAt: now },
  });

  const cvAsset = await db.cvAsset.findFirst({
    where: { isActive: true },
  });
  if (!cvAsset) {
    res.status(404).json({ message: "CV is currently unavailable." });
    return;
  }
  const requestedDocument = getCvDocument(cvAsset, documentType);
  if (!requestedDocument.filePath) {
    res.status(404).json({ message: `${documentType} CV is currently unavailable.` });
    return;
  }

  const token = signCvDownloadToken({
    email,
    cvAssetId: cvAsset.id,
    documentType,
    filePath: requestedDocument.filePath,
    expiresInSeconds: env.CV_DOWNLOAD_TOKEN_TTL_SECONDS,
  });

  const expiresAt = new Date(
    now.getTime() + env.CV_DOWNLOAD_TOKEN_TTL_SECONDS * 1000,
  ).toISOString();

  const encodedToken = encodeURIComponent(token);
  const downloadUrl = `${getApiBaseUrl(
    req,
  )}/api/public/cv/download?token=${encodedToken}`;

  res.status(200).json({
    data: {
      token,
      downloadUrl,
      expiresAt,
      expiresInSeconds: env.CV_DOWNLOAD_TOKEN_TTL_SECONDS,
    },
  });
};

export const downloadCvByToken: RequestHandler = async (req, res) => {
  const parsed = downloadQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, "Invalid download token.", parsed.error);
    return;
  }

  let payload: ReturnType<typeof verifyCvDownloadToken>;
  try {
    payload = verifyCvDownloadToken(parsed.data.token);
  } catch {
    res.status(401).json({ message: "Invalid or expired download token." });
    return;
  }

  const cvAsset = await db.cvAsset.findFirst({
    where: { isActive: true },
  });
  if (!cvAsset) {
    res.status(404).json({ message: "CV is currently unavailable." });
    return;
  }

  const documentType = payload.documentType ?? "Visual";
  const requestedDocument = getCvDocument(cvAsset, documentType);
  if (
    payload.filePath !== requestedDocument.filePath ||
    (payload.cvAssetId && payload.cvAssetId !== cvAsset.id)
  ) {
    res.status(401).json({ message: "Download token no longer valid." });
    return;
  }

  try {
    const bucket = getFirebaseStorageBucket();
    const file = bucket.file(requestedDocument.filePath);
    const [metadata] = await file.getMetadata();
    const fileName = sanitizeFileName(requestedDocument.fileName || "cv.pdf");
    const contentType = metadata.contentType || requestedDocument.mimeType || "application/pdf";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    if (typeof metadata.size === "string" && metadata.size) {
      res.setHeader("Content-Length", metadata.size);
    }

    await db.cvDownload
      .create({
        data: {
          cvAssetId: cvAsset.id,
          email: normalizeEmail(payload.email),
          documentType,
        },
      })
      .catch(() => undefined);

    await streamFileToResponse(requestedDocument.filePath, res);
  } catch (error) {
    if (isNotFoundError(error)) {
      res.status(404).json({ message: "CV file not found." });
      return;
    }
    if (res.headersSent) {
      res.destroy();
      return;
    }
    const message =
      error instanceof Error ? error.message : "Failed to download CV.";
    res.status(500).json({ message });
  }
};
