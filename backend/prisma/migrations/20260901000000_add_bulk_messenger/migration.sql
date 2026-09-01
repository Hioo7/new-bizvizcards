-- CreateEnum
CREATE TYPE "BulkMessageRecipientStatus" AS ENUM ('PENDING', 'MESSAGED');

-- CreateTable
CREATE TABLE "BulkMessengerPolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "maxTemplates" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkMessengerPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkMessageTemplate" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkedFormId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkMessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkMessageSend" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "templateId" UUID,
    "templateNameSnapshot" TEXT NOT NULL,
    "bodySnapshot" TEXT NOT NULL,
    "linkedFormIdSnapshot" UUID,
    "linkedFormNameSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkMessageSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkMessageSendRecipient" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "sendId" UUID NOT NULL,
    "leadId" UUID,
    "recipientNameSnapshot" TEXT NOT NULL,
    "recipientEmailSnapshot" TEXT,
    "countryDialCodeSnapshot" TEXT NOT NULL,
    "phoneNumberSnapshot" TEXT NOT NULL,
    "resolvedMessage" TEXT NOT NULL,
    "status" "BulkMessageRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "messagedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkMessageSendRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkMessageTemplate_customerId_idx" ON "BulkMessageTemplate"("customerId");

-- CreateIndex
CREATE INDEX "BulkMessageTemplate_linkedFormId_idx" ON "BulkMessageTemplate"("linkedFormId");

-- CreateIndex
CREATE INDEX "BulkMessageSend_customerId_idx" ON "BulkMessageSend"("customerId");

-- CreateIndex
CREATE INDEX "BulkMessageSend_templateId_idx" ON "BulkMessageSend"("templateId");

-- CreateIndex
CREATE INDEX "BulkMessageSendRecipient_sendId_idx" ON "BulkMessageSendRecipient"("sendId");

-- CreateIndex
CREATE INDEX "BulkMessageSendRecipient_leadId_idx" ON "BulkMessageSendRecipient"("leadId");

-- AddForeignKey
ALTER TABLE "BulkMessageTemplate" ADD CONSTRAINT "BulkMessageTemplate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessageTemplate" ADD CONSTRAINT "BulkMessageTemplate_linkedFormId_fkey" FOREIGN KEY ("linkedFormId") REFERENCES "ExchangeContactForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessageSend" ADD CONSTRAINT "BulkMessageSend_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessageSend" ADD CONSTRAINT "BulkMessageSend_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BulkMessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessageSendRecipient" ADD CONSTRAINT "BulkMessageSendRecipient_sendId_fkey" FOREIGN KEY ("sendId") REFERENCES "BulkMessageSend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkMessageSendRecipient" ADD CONSTRAINT "BulkMessageSendRecipient_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
-- Nullable for now — PlanPolicy already has existing rows with no value for
-- this column. Backfilled by raw SQL immediately below (same migration, same
-- transaction), then set NOT NULL — per backend/CLAUDE.md's convention for
-- adding a required FK column to a table with production rows. Same shape as
-- the virtualBackgroundPolicyId backfill in 20260807120000_add_virtual_backgrounds.
ALTER TABLE "PlanPolicy" ADD COLUMN "bulkMessengerPolicyId" UUID;

-- Backfill: create one default BulkMessengerPolicy row (unavailable, zero
-- limit — same "new paid-tier feature defaults off" convention as every other
-- gated policy) for every existing PlanPolicy row, and point it at that row. A
-- temporary mapping table (dropped at the end of this same migration
-- transaction) pairs each PlanPolicy row with a freshly generated
-- BulkMessengerPolicy id, so the statements below stay correct regardless of
-- row count.
CREATE TEMPORARY TABLE "_bm_policy_backfill" AS
SELECT "id" AS "planPolicyId", pg_catalog.gen_random_uuid() AS "bmPolicyId"
FROM "PlanPolicy";

INSERT INTO "BulkMessengerPolicy" ("id", "isAvailable", "maxTemplates", "updatedAt")
SELECT "bmPolicyId", false, 0, CURRENT_TIMESTAMP FROM "_bm_policy_backfill";

UPDATE "PlanPolicy" AS "pp"
SET "bulkMessengerPolicyId" = "b"."bmPolicyId"
FROM "_bm_policy_backfill" AS "b"
WHERE "pp"."id" = "b"."planPolicyId";

DROP TABLE "_bm_policy_backfill";

-- AlterTable
ALTER TABLE "PlanPolicy" ALTER COLUMN "bulkMessengerPolicyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_bulkMessengerPolicyId_key" ON "PlanPolicy"("bulkMessengerPolicyId");

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_bulkMessengerPolicyId_fkey" FOREIGN KEY ("bulkMessengerPolicyId") REFERENCES "BulkMessengerPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
