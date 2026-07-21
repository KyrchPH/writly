CREATE TYPE "CvDocumentType" AS ENUM ('ATS', 'Visual');

ALTER TABLE "CvAsset"
  ADD COLUMN "atsFilePath" TEXT,
  ADD COLUMN "atsFileUrl" TEXT,
  ADD COLUMN "atsFileName" TEXT,
  ADD COLUMN "atsMimeType" TEXT,
  ADD COLUMN "visualFilePath" TEXT,
  ADD COLUMN "visualFileUrl" TEXT,
  ADD COLUMN "visualFileName" TEXT,
  ADD COLUMN "visualMimeType" TEXT,
  ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);

UPDATE "CvAsset"
SET
  "atsFilePath" = "filePath",
  "atsFileUrl" = "fileUrl",
  "atsFileName" = "fileName",
  "atsMimeType" = "mimeType",
  "visualFilePath" = "filePath",
  "visualFileUrl" = "fileUrl",
  "visualFileName" = "fileName",
  "visualMimeType" = "mimeType",
  "statusUpdatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

ALTER TABLE "CvAsset"
  ALTER COLUMN "atsFilePath" SET NOT NULL,
  ALTER COLUMN "atsFilePath" SET DEFAULT '',
  ALTER COLUMN "atsFileUrl" SET NOT NULL,
  ALTER COLUMN "atsFileUrl" SET DEFAULT '',
  ALTER COLUMN "atsFileName" SET NOT NULL,
  ALTER COLUMN "atsFileName" SET DEFAULT '',
  ALTER COLUMN "atsMimeType" SET NOT NULL,
  ALTER COLUMN "atsMimeType" SET DEFAULT 'application/pdf',
  ALTER COLUMN "visualFilePath" SET NOT NULL,
  ALTER COLUMN "visualFilePath" SET DEFAULT '',
  ALTER COLUMN "visualFileUrl" SET NOT NULL,
  ALTER COLUMN "visualFileUrl" SET DEFAULT '',
  ALTER COLUMN "visualFileName" SET NOT NULL,
  ALTER COLUMN "visualFileName" SET DEFAULT '',
  ALTER COLUMN "visualMimeType" SET NOT NULL,
  ALTER COLUMN "visualMimeType" SET DEFAULT 'application/pdf',
  ALTER COLUMN "statusUpdatedAt" SET NOT NULL,
  ALTER COLUMN "statusUpdatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "CvDownload"
  ADD COLUMN "documentType" "CvDocumentType" NOT NULL DEFAULT 'Visual';

CREATE INDEX "CvDownload_cvAssetId_documentType_createdAt_idx" ON "CvDownload"("cvAssetId", "documentType", "createdAt");
