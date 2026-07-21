ALTER TABLE "CvAsset" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "CvAsset" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

UPDATE "CvAsset"
SET "isActive" = true
WHERE "id" = 'primary';
