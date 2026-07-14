-- Relax the 1:1 Customer<->OrganisationMember constraint: a customer can now
-- belong to multiple organisations, one membership per organisation.
DROP INDEX "OrganisationMember_customerId_key";
CREATE UNIQUE INDEX "OrganisationMember_customerId_organisationId_key" ON "OrganisationMember"("customerId", "organisationId");

-- Business pfp for the e-card Hero organisation picker. Nullable, no
-- backfill needed — no admin/SPOC UI sets this yet.
ALTER TABLE "Organisation" ADD COLUMN "logoMediaId" UUID;
CREATE UNIQUE INDEX "Organisation_logoMediaId_key" ON "Organisation"("logoMediaId");

ALTER TABLE "Organisation"
  ADD CONSTRAINT "Organisation_logoMediaId_fkey"
  FOREIGN KEY ("logoMediaId") REFERENCES "Media"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
