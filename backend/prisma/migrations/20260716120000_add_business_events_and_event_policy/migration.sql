-- CreateEnum
CREATE TYPE "EventMemberRole" AS ENUM ('HOST', 'CO_HOST', 'VOLUNTEER');

-- CreateTable
CREATE TABLE "BusinessEvent" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "createdByEmployeeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMember" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "role" "EventMemberRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGuest" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedInByCustomerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTrackable" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTrackable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTrackableRedemption" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "trackableId" UUID NOT NULL,
    "eventGuestId" UUID NOT NULL,
    "scannedByCustomerId" UUID NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTrackableRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxEvents" INTEGER NOT NULL DEFAULT 0,
    "maxGuestsPerEvent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPolicy_pkey" PRIMARY KEY ("id")
);

-- AlterTable
-- Nullable for now — PlanPolicy already has existing rows with no value for
-- this column. backend/prisma/scripts/seed-event-policy-defaults.ts backfills
-- every existing row, then migration
-- 20260716120500_make_plan_policy_event_policy_id_required sets this NOT NULL.
ALTER TABLE "PlanPolicy" ADD COLUMN "eventPolicyId" UUID;

-- CreateIndex
CREATE INDEX "BusinessEvent_createdByEmployeeId_idx" ON "BusinessEvent"("createdByEmployeeId");

-- CreateIndex
CREATE INDEX "EventMember_eventId_idx" ON "EventMember"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventMember_customerId_eventId_key" ON "EventMember"("customerId", "eventId");

-- CreateIndex
CREATE INDEX "EventGuest_eventId_idx" ON "EventGuest"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventGuest_customerId_eventId_key" ON "EventGuest"("customerId", "eventId");

-- CreateIndex
CREATE INDEX "EventTrackable_eventId_idx" ON "EventTrackable"("eventId");

-- CreateIndex
CREATE INDEX "EventTrackableRedemption_trackableId_idx" ON "EventTrackableRedemption"("trackableId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTrackableRedemption_trackableId_eventGuestId_key" ON "EventTrackableRedemption"("trackableId", "eventGuestId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_eventPolicyId_key" ON "PlanPolicy"("eventPolicyId");

-- AddForeignKey
ALTER TABLE "BusinessEvent" ADD CONSTRAINT "BusinessEvent_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "BusinessEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "BusinessEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_checkedInByCustomerId_fkey" FOREIGN KEY ("checkedInByCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTrackable" ADD CONSTRAINT "EventTrackable_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "BusinessEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTrackableRedemption" ADD CONSTRAINT "EventTrackableRedemption_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "EventTrackable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTrackableRedemption" ADD CONSTRAINT "EventTrackableRedemption_eventGuestId_fkey" FOREIGN KEY ("eventGuestId") REFERENCES "EventGuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTrackableRedemption" ADD CONSTRAINT "EventTrackableRedemption_scannedByCustomerId_fkey" FOREIGN KEY ("scannedByCustomerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_eventPolicyId_fkey" FOREIGN KEY ("eventPolicyId") REFERENCES "EventPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
