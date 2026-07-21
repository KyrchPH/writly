import type { JwtPayload } from "jsonwebtoken";

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
};

export type CvDownloadTokenPayload = JwtPayload & {
  type: "cv_download";
  email: string;
  cvAssetId?: string;
  documentType?: "ATS" | "Visual";
  filePath: string;
};
