import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import {
  getFirebaseStorageBucket,
  getFirebaseStorageBucketName,
} from "../lib/firebase-storage.js";
import { sendValidationError } from "./helpers.js";

const uploadFolders = [
  "projects",
  "services",
  "banners",
  "work-experiences",
  "certificates",
  "clients",
  "reviews",
  "files",
] as const;

const uploadFolderSchema = z.enum(uploadFolders);

const signUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(3).max(120),
  folder: uploadFolderSchema.default("files"),
});

const directUploadSchema = signUploadSchema;

const signedReadSchema = z.object({
  filePath: z.string().min(1).max(1024),
  expiresInSeconds: z.coerce.number().int().min(60).max(86400).default(900),
});

const deleteFileSchema = z.object({
  filePath: z.string().min(1).max(1024),
});

const proxyUrlSchema = z.object({
  filePath: z.string().min(1).max(1024),
});

const proxyPathParamSchema = z.object({
  encodedPath: z.string().min(1).max(4096),
});

const safeBaseName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

const fileExtension = (name: string) => {
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
};

const encodeStoragePath = (filePath: string) =>
  Buffer.from(filePath, "utf8").toString("base64url");

const decodeStoragePath = (encodedPath: string) => {
  try {
    return Buffer.from(encodedPath, "base64url").toString("utf8");
  } catch {
    return null;
  }
};

const isSafeStoragePath = (value: string) => {
  if (!value || value.length > 1024) return false;
  if (value.includes("\0")) return false;
  if (value.includes("..")) return false;
  if (value.startsWith("/") || value.startsWith("\\")) return false;
  const firstSegment = value.split("/")[0];
  return uploadFolders.includes(firstSegment as (typeof uploadFolders)[number]);
};

const getApiBaseUrl = (req: Request) => {
  const host = req.get("x-forwarded-host") ?? req.get("host");
  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() || req.protocol;
  return `${protocol}://${host}`;
};

const buildProxyPath = (filePath: string) =>
  `/api/public/files/${encodeStoragePath(filePath)}`;

const buildProxyUrl = (req: Request, filePath: string) =>
  `${getApiBaseUrl(req)}${buildProxyPath(filePath)}`;

const isNotFoundError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: number; statusCode?: number };
  return err.code === 404 || err.statusCode === 404;
};

const sanitizeFileName = (name: string) => name.replace(/["\r\n]/g, "_");

const buildObjectKey = (filename: string, folder: (typeof uploadFolders)[number]) => {
  const extension = fileExtension(filename);
  const baseName = safeBaseName(filename) || "file";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const datedPrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
  return extension
    ? `${folder}/${datedPrefix}/${baseName}-${unique}.${extension}`
    : `${folder}/${datedPrefix}/${baseName}-${unique}`;
};

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

export const signUploadUrl: RequestHandler = async (req, res) => {
  const parsed = signUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid upload sign payload.", parsed.error);
    return;
  }

  const { filename, contentType, folder } = parsed.data;
  const objectKey = buildObjectKey(filename, folder);

  try {
    const bucket = getFirebaseStorageBucket();
    const expiresIn = 15 * 60;
    const expiresAtMs = Date.now() + expiresIn * 1000;
    const [uploadUrl] = await bucket.file(objectKey).getSignedUrl({
      version: "v4",
      action: "write",
      expires: expiresAtMs,
      contentType,
    });
    const proxyPath = buildProxyPath(objectKey);
    const proxyUrl = buildProxyUrl(req, objectKey);

    res.status(200).json({
      data: {
        filePath: objectKey,
        proxyPath,
        proxyUrl,
        uploadUrl,
        method: "PUT",
        expiresAt: new Date(expiresAtMs).toISOString(),
        headers: {
          "Content-Type": contentType,
        },
        storageBucket: getFirebaseStorageBucketName(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign upload URL.";
    res.status(500).json({ message });
  }
};

export const uploadFile: RequestHandler = async (req, res) => {
  const parsed = directUploadSchema.safeParse({
    filename: req.query.filename,
    folder: req.query.folder,
    contentType: req.get("content-type") || "application/octet-stream",
  });
  if (!parsed.success) {
    sendValidationError(res, "Invalid upload payload.", parsed.error);
    return;
  }

  const body = Buffer.isBuffer(req.body) ? req.body : null;
  if (!body || body.length === 0) {
    res.status(400).json({ message: "Upload body is empty." });
    return;
  }

  const { filename, contentType, folder } = parsed.data;
  const objectKey = buildObjectKey(filename, folder);

  try {
    const bucket = getFirebaseStorageBucket();
    await bucket.file(objectKey).save(body, {
      contentType,
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    res.status(201).json({
      data: {
        filePath: objectKey,
        proxyPath: buildProxyPath(objectKey),
        proxyUrl: buildProxyUrl(req, objectKey),
        storageBucket: getFirebaseStorageBucketName(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload file.";
    res.status(500).json({ message });
  }
};

export const testUploadStorageAccess: RequestHandler = async (_req, res) => {
  try {
    const bucket = getFirebaseStorageBucket();
    await bucket.getMetadata();
    res.status(200).json({
      data: {
        ok: true,
        storage: "firebase",
        bucket: getFirebaseStorageBucketName(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to access Firebase Storage bucket.";
    res.status(500).json({
      data: {
        ok: false,
        storage: "firebase",
      },
      message,
    });
  }
};

export const getProxyFileUrl: RequestHandler = async (req, res) => {
  const parsed = proxyUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid proxy-url payload.", parsed.error);
    return;
  }

  const { filePath } = parsed.data;
  if (!isSafeStoragePath(filePath)) {
    res.status(400).json({ message: "Invalid file path." });
    return;
  }

  try {
    const bucket = getFirebaseStorageBucket();
    const [exists] = await bucket.file(filePath).exists();
    if (!exists) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    res.status(200).json({
      data: {
        filePath,
        proxyPath: buildProxyPath(filePath),
        proxyUrl: buildProxyUrl(req, filePath),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build proxy URL.";
    res.status(500).json({ message });
  }
};

export const signReadUrl: RequestHandler = async (req, res) => {
  const parsed = signedReadSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid read-url payload.", parsed.error);
    return;
  }

  try {
    const bucket = getFirebaseStorageBucket();
    const file = bucket.file(parsed.data.filePath);
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    const expiresAtMs = Date.now() + parsed.data.expiresInSeconds * 1000;
    const [readUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: expiresAtMs,
    });

    res.status(200).json({
      data: {
        filePath: parsed.data.filePath,
        readUrl,
        expiresAt: new Date(expiresAtMs).toISOString(),
      },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      res.status(404).json({ message: "File not found." });
      return;
    }
    const message =
      error instanceof Error ? error.message : "Failed to sign read URL.";
    res.status(500).json({ message });
  }
};

export const streamFileByProxyPath: RequestHandler = async (req, res) => {
  const parsedParams = proxyPathParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    sendValidationError(res, "Invalid file path parameter.", parsedParams.error);
    return;
  }

  const filePath = decodeStoragePath(parsedParams.data.encodedPath);
  if (!filePath || !isSafeStoragePath(filePath)) {
    res.status(400).json({ message: "Invalid encoded file path." });
    return;
  }

  try {
    const bucket = getFirebaseStorageBucket();
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();

    const contentType = metadata.contentType || "application/octet-stream";
    const cacheControl = metadata.cacheControl || "public, max-age=31536000, immutable";
    const fileName = sanitizeFileName(filePath.split("/").pop() || "file");
    const forceDownload =
      req.query.download === "1" || req.query.download === "true";
    const disposition = forceDownload ? "attachment" : "inline";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    if (typeof metadata.etag === "string" && metadata.etag) {
      res.setHeader("ETag", metadata.etag);
    }
    if (typeof metadata.updated === "string" && metadata.updated) {
      res.setHeader("Last-Modified", new Date(metadata.updated).toUTCString());
    }
    res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);
    res.setHeader("Accept-Ranges", "bytes");
    if (typeof metadata.size === "string" && metadata.size) {
      res.setHeader("Content-Length", metadata.size);
    }

    await streamFileToResponse(filePath, res);
  } catch (error) {
    if (isNotFoundError(error)) {
      res.status(404).json({ message: "File not found." });
      return;
    }
    if (res.headersSent) {
      res.destroy();
      return;
    }
    const message =
      error instanceof Error ? error.message : "Failed to read file.";
    res.status(500).json({ message });
  }
};

export const deleteUploadedFile: RequestHandler = async (req, res) => {
  const parsed = deleteFileSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, "Invalid delete payload.", parsed.error);
    return;
  }

  try {
    const bucket = getFirebaseStorageBucket();
    await bucket.file(parsed.data.filePath).delete({ ignoreNotFound: true });
    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete file.";
    res.status(500).json({ message });
  }
};
