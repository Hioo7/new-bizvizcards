-- AlterTable
-- Run only after backend/prisma/scripts/seed-event-policy-defaults.ts has
-- backfilled every existing PlanPolicy row (see the previous migration).
ALTER TABLE "PlanPolicy" ALTER COLUMN "eventPolicyId" SET NOT NULL;
