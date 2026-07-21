-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('Pending', 'Approved');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "clientId" TEXT;
ALTER TABLE "Review" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'Pending';
ALTER TABLE "Review" ALTER COLUMN "isPublished" SET DEFAULT false;

-- Preserve existing manually-created reviews as approved public reviews.
UPDATE "Review"
SET "status" = CASE WHEN "isPublished" = true THEN 'Approved'::"ReviewStatus" ELSE 'Pending'::"ReviewStatus" END;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewInvitation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewInvitation_tokenHash_key" ON "ReviewInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "ReviewInvitation_clientId_createdAt_idx" ON "ReviewInvitation"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewInvitation_expiresAt_idx" ON "ReviewInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "Review_clientId_createdAt_idx" ON "Review"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_status_updatedAt_idx" ON "Review"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Review_isPublished_updatedAt_idx" ON "Review"("isPublished", "updatedAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewInvitation" ADD CONSTRAINT "ReviewInvitation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
