ALTER TABLE "Project"
ADD COLUMN "portraitImageUrl" TEXT,
ADD COLUMN "landscapeImageUrl" TEXT,
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Project_isFeatured_updatedAt_idx" ON "Project"("isFeatured", "updatedAt");
CREATE INDEX "Project_isPinned_updatedAt_idx" ON "Project"("isPinned", "updatedAt");

ALTER TABLE "ContactConfig"
ADD COLUMN "showEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showPhone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showInstagram" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showWhatsapp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showTelegram" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showLinkedin" BOOLEAN NOT NULL DEFAULT true;
