CREATE TABLE "CvDownload" (
    "id" TEXT NOT NULL,
    "cvAssetId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvDownload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CvDownload_cvAssetId_createdAt_idx" ON "CvDownload"("cvAssetId", "createdAt");
CREATE INDEX "CvDownload_email_createdAt_idx" ON "CvDownload"("email", "createdAt");

ALTER TABLE "CvDownload" ADD CONSTRAINT "CvDownload_cvAssetId_fkey" FOREIGN KEY ("cvAssetId") REFERENCES "CvAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
