-- CreateEnum
CREATE TYPE "VirtualBackgroundQrCorner" AS ENUM ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');

-- CreateTable
CREATE TABLE "VirtualBackgroundPolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "maxVirtualBackgrounds" INTEGER NOT NULL DEFAULT 0,
    "allowCustomBackground" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualBackgroundPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualBackgroundTemplate" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "mediaId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualBackgroundTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualBackgroundPolicyTemplate" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "virtualBackgroundPolicyId" UUID NOT NULL,
    "templateId" UUID NOT NULL,

    CONSTRAINT "VirtualBackgroundPolicyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualBackground" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "ecardId" UUID NOT NULL,
    "sourceTemplateId" UUID,
    "customBaseMediaId" UUID,
    "qrCorner" "VirtualBackgroundQrCorner" NOT NULL DEFAULT 'BOTTOM_RIGHT',
    "captionText" TEXT,
    "composedMediaId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualBackground_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VirtualBackgroundTemplate_mediaId_key" ON "VirtualBackgroundTemplate"("mediaId");

-- CreateIndex
CREATE INDEX "VirtualBackgroundPolicyTemplate_virtualBackgroundPolicyId_idx" ON "VirtualBackgroundPolicyTemplate"("virtualBackgroundPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualBackgroundPolicyTemplate_virtualBackgroundPolicyId_t_key" ON "VirtualBackgroundPolicyTemplate"("virtualBackgroundPolicyId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualBackground_customBaseMediaId_key" ON "VirtualBackground"("customBaseMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualBackground_composedMediaId_key" ON "VirtualBackground"("composedMediaId");

-- CreateIndex
CREATE INDEX "VirtualBackground_customerId_idx" ON "VirtualBackground"("customerId");

-- CreateIndex
CREATE INDEX "VirtualBackground_ecardId_idx" ON "VirtualBackground"("ecardId");

-- CreateIndex
CREATE INDEX "VirtualBackground_sourceTemplateId_idx" ON "VirtualBackground"("sourceTemplateId");

-- AddForeignKey
ALTER TABLE "VirtualBackgroundTemplate" ADD CONSTRAINT "VirtualBackgroundTemplate_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualBackgroundPolicyTemplate" ADD CONSTRAINT "VirtualBackgroundPolicyTemplate_virtualBackgroundPolicyId_fkey" FOREIGN KEY ("virtualBackgroundPolicyId") REFERENCES "VirtualBackgroundPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualBackgroundPolicyTemplate" ADD CONSTRAINT "VirtualBackgroundPolicyTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "VirtualBackgroundTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualBackground" ADD CONSTRAINT "VirtualBackground_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualBackground" ADD CONSTRAINT "VirtualBackground_ecardId_fkey" FOREIGN KEY ("ecardId") REFERENCES "ECard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualBackground" ADD CONSTRAINT "VirtualBackground_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "VirtualBackgroundTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualBackground" ADD CONSTRAINT "VirtualBackground_customBaseMediaId_fkey" FOREIGN KEY ("customBaseMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualBackground" ADD CONSTRAINT "VirtualBackground_composedMediaId_fkey" FOREIGN KEY ("composedMediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
-- Nullable for now — PlanPolicy already has existing rows with no value for
-- this column. Backfilled by raw SQL immediately below (same migration, same
-- transaction), then set NOT NULL — per backend/CLAUDE.md's convention for
-- adding a required FK column to a table with production rows.
ALTER TABLE "PlanPolicy" ADD COLUMN "virtualBackgroundPolicyId" UUID;

-- Backfill: create one default VirtualBackgroundPolicy row (unavailable,
-- zero limit, no custom backgrounds, no whitelisted templates — same "new
-- paid-tier feature defaults off" convention as every other gated policy)
-- for every existing PlanPolicy row, and point it at that row. A temporary
-- mapping table (dropped at the end of this same migration transaction)
-- pairs each PlanPolicy row with a freshly generated VirtualBackgroundPolicy
-- id, so the two statements below stay correct regardless of row count.
CREATE TEMPORARY TABLE "_vb_policy_backfill" AS
SELECT "id" AS "planPolicyId", pg_catalog.gen_random_uuid() AS "vbPolicyId"
FROM "PlanPolicy";

INSERT INTO "VirtualBackgroundPolicy" ("id", "isAvailable", "maxVirtualBackgrounds", "allowCustomBackground", "updatedAt")
SELECT "vbPolicyId", false, 0, false, CURRENT_TIMESTAMP FROM "_vb_policy_backfill";

UPDATE "PlanPolicy" AS "pp"
SET "virtualBackgroundPolicyId" = "b"."vbPolicyId"
FROM "_vb_policy_backfill" AS "b"
WHERE "pp"."id" = "b"."planPolicyId";

DROP TABLE "_vb_policy_backfill";

-- AlterTable
ALTER TABLE "PlanPolicy" ALTER COLUMN "virtualBackgroundPolicyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_virtualBackgroundPolicyId_key" ON "PlanPolicy"("virtualBackgroundPolicyId");

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_virtualBackgroundPolicyId_fkey" FOREIGN KEY ("virtualBackgroundPolicyId") REFERENCES "VirtualBackgroundPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
