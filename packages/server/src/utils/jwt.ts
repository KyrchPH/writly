import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AccessTokenPayload, CvDownloadTokenPayload } from "../types/auth.js";

const JWT_SECRET: Secret = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

export const signAccessToken = (payload: { sub: string; email: string }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, JWT_SECRET) as AccessTokenPayload;

export const signCvDownloadToken = (payload: {
  email: string;
  cvAssetId: string;
  documentType: "ATS" | "Visual";
  filePath: string;
  expiresInSeconds: number;
}) =>
  jwt.sign(
    {
      type: "cv_download",
      email: payload.email,
      cvAssetId: payload.cvAssetId,
      documentType: payload.documentType,
      filePath: payload.filePath,
    },
    JWT_SECRET,
    { expiresIn: payload.expiresInSeconds },
  );

export const verifyCvDownloadToken = (token: string): CvDownloadTokenPayload => {
  const payload = jwt.verify(token, JWT_SECRET) as CvDownloadTokenPayload;
  if (payload.type !== "cv_download") {
    throw new Error("Invalid token type.");
  }
  return payload;
};
