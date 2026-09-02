-- better-auth 1.7's account-identity change adds a required `issuer` column
-- (scoping an account by issuer rather than just provider config) to the
-- account/credential model. CustomerCredential has 626 existing rows, so per
-- backend/CLAUDE.md's convention for a new required column on a table with
-- production rows, the backfill runs as raw SQL in this same migration,
-- ahead of the NOT NULL constraint, in one transaction. Values follow the
-- official backfill table in better-auth's 1.7 upgrade guide:
--   credential                        -> "local:credential"
--   provider with a known issuer      -> that issuer's URL
--   OAuth provider without an issuer  -> "local:oauth:<providerId>"
-- EmployeeCredential has zero rows today (employees sign in via OTP only,
-- which never creates a credential row) but is backfilled the same way
-- defensively, in case that changes before this migration reaches another
-- environment.

-- AlterTable: add as nullable first so existing rows can be backfilled
ALTER TABLE "CustomerCredential" ADD COLUMN "issuer" TEXT;
ALTER TABLE "EmployeeCredential" ADD COLUMN "issuer" TEXT;

-- Backfill CustomerCredential
UPDATE "CustomerCredential" SET "issuer" = 'local:credential' WHERE "providerId" = 'credential';
UPDATE "CustomerCredential" SET "issuer" = 'https://accounts.google.com' WHERE "providerId" = 'google';
UPDATE "CustomerCredential" SET "issuer" = 'https://appleid.apple.com' WHERE "providerId" = 'apple';
UPDATE "CustomerCredential" SET "issuer" = 'local:oauth:' || "providerId" WHERE "issuer" IS NULL;

-- Backfill EmployeeCredential (defensive — table is empty today)
UPDATE "EmployeeCredential" SET "issuer" = 'local:credential' WHERE "providerId" = 'credential';
UPDATE "EmployeeCredential" SET "issuer" = 'https://accounts.google.com' WHERE "providerId" = 'google';
UPDATE "EmployeeCredential" SET "issuer" = 'https://appleid.apple.com' WHERE "providerId" = 'apple';
UPDATE "EmployeeCredential" SET "issuer" = 'local:oauth:' || "providerId" WHERE "issuer" IS NULL;

-- Now safe to enforce NOT NULL
ALTER TABLE "CustomerCredential" ALTER COLUMN "issuer" SET NOT NULL;
ALTER TABLE "EmployeeCredential" ALTER COLUMN "issuer" SET NOT NULL;

-- CreateIndex: compound uniqueness per better-auth 1.7's account-identity model
CREATE UNIQUE INDEX "CustomerCredential_issuer_accountId_uidx" ON "CustomerCredential"("issuer", "accountId");
CREATE UNIQUE INDEX "EmployeeCredential_issuer_accountId_uidx" ON "EmployeeCredential"("issuer", "accountId");
