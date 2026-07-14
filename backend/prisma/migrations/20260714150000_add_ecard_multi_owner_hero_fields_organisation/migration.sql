-- Remove the 1:1 Customer<->ECard constraint: a customer can now own multiple ecards.
DROP INDEX "ECard_customerId_key";

-- Add the new columns nullable first so existing rows can be backfilled
-- before heroName/heroEmail become NOT NULL.
ALTER TABLE "ECard"
  ADD COLUMN "heroName" TEXT,
  ADD COLUMN "heroEmail" TEXT,
  ADD COLUMN "organisationId" UUID;

-- Backfill existing cards' hero identity from the account they were
-- previously derived from at read time, so nothing goes blank.
UPDATE "ECard" e
SET "heroName" = a."name",
    "heroEmail" = a."email"
FROM "Customer" c
JOIN "CustomerAccount" a ON a."id" = c."accountId"
WHERE c."id" = e."customerId";

-- Now that every row has a value, enforce NOT NULL.
ALTER TABLE "ECard"
  ALTER COLUMN "heroName" SET NOT NULL,
  ALTER COLUMN "heroEmail" SET NOT NULL;

-- At most one ecard per customer per organisation (NULL organisationId,
-- i.e. personal/unaffiliated cards, is excluded from this constraint by
-- Postgres' NULLs-are-distinct behavior, so those remain unlimited).
CREATE INDEX "ECard_organisationId_idx" ON "ECard"("organisationId");
CREATE UNIQUE INDEX "ECard_customerId_organisationId_key" ON "ECard"("customerId", "organisationId");

ALTER TABLE "ECard"
  ADD CONSTRAINT "ECard_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
