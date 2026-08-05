-- AlterTable
-- Run only after backend/prisma/scripts/seed-email-signature-policy-defaults.ts
-- has backfilled every existing PlanPolicy row (see the previous migration).
ALTER TABLE "PlanPolicy" ALTER COLUMN "emailSignaturePolicyId" SET NOT NULL;
