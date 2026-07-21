CREATE TABLE "ContractTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL,
  "templateId" TEXT,
  "title" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT,
  "content" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "viewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContractTemplate_updatedAt_idx" ON "ContractTemplate"("updatedAt");
CREATE INDEX "Contract_templateId_createdAt_idx" ON "Contract"("templateId", "createdAt");
CREATE INDEX "Contract_recipientEmail_createdAt_idx" ON "Contract"("recipientEmail", "createdAt");
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
