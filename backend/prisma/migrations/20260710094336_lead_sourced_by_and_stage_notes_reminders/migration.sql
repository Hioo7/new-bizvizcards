-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('SMART_CARD', 'E_CARD', 'CARD_SCANNER', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('LEAD', 'QUALIFIED_LEAD', 'NEEDS_ANALYSIS', 'PROPOSAL_DEMO', 'NEGOTIATION', 'CLOSED_WON', 'ONBOARDING', 'ACTIVE_RETENTION', 'CHURNED_CLOSED_LOST');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'TRIGGERED', 'DISMISSED');

-- AlterTable: additive columns first so every existing row gets a valid
-- sourcedBy via the DEFAULT before the corrective backfill below runs.
ALTER TABLE "Lead"
  ADD COLUMN "sourcedBy" "LeadSourceType" NOT NULL DEFAULT 'MANUAL_ENTRY',
  ADD COLUMN "stage" "OpportunityStage";

-- Defensive backfill: any lead that recorded a source smart card is
-- reclassified as SMART_CARD before sourceSmartCardId is dropped.
UPDATE "Lead" SET "sourcedBy" = 'SMART_CARD' WHERE "sourceSmartCardId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_sourceSmartCardId_fkey";

-- DropIndex
DROP INDEX "Lead_sourceSmartCardId_idx";

-- AlterTable: drop the now-replaced column last, after all dependents are gone.
ALTER TABLE "Lead" DROP COLUMN "sourceSmartCardId";

-- CreateTable
CREATE TABLE "LeadReferenceNote" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadReferenceNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadReferenceNote_leadId_idx" ON "LeadReferenceNote"("leadId");

-- AddForeignKey
ALTER TABLE "LeadReferenceNote" ADD CONSTRAINT "LeadReferenceNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "LeadReminder" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "triggerAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadReminder_leadId_idx" ON "LeadReminder"("leadId");

-- CreateIndex
CREATE INDEX "LeadReminder_status_triggerAt_idx" ON "LeadReminder"("status", "triggerAt");

-- AddForeignKey
ALTER TABLE "LeadReminder" ADD CONSTRAINT "LeadReminder_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
