-- CreateEnum
CREATE TYPE "EmailSignatureTemplateKey" AS ENUM ('MODERN', 'CORPORATE', 'MINIMAL');

-- CreateEnum
CREATE TYPE "EmailSignatureSocialPlatform" AS ENUM ('LINKEDIN', 'TWITTER', 'FACEBOOK', 'INSTAGRAM', 'GITHUB', 'YOUTUBE', 'TIKTOK', 'WEBSITE', 'CUSTOM');

-- CreateTable
CREATE TABLE "EmailSignature" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "templateKey" "EmailSignatureTemplateKey" NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "profileImageMediaId" UUID,
    "companyLogoMediaId" UUID,
    "bannerImageMediaId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSignatureSocialLink" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "emailSignatureId" UUID NOT NULL,
    "platform" "EmailSignatureSocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailSignatureSocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSignaturePolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxEmailSignatures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSignaturePolicy_pkey" PRIMARY KEY ("id")
);

-- AlterTable
-- Nullable for now — PlanPolicy already has existing rows with no value for
-- this column. backend/prisma/scripts/seed-email-signature-policy-defaults.ts
-- backfills every existing row, then migration
-- 20260805120500_make_plan_policy_email_signature_policy_id_required sets
-- this NOT NULL.
ALTER TABLE "PlanPolicy" ADD COLUMN "emailSignaturePolicyId" UUID;

-- CreateIndex
CREATE INDEX "EmailSignature_customerId_idx" ON "EmailSignature"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignature_profileImageMediaId_key" ON "EmailSignature"("profileImageMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignature_companyLogoMediaId_key" ON "EmailSignature"("companyLogoMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignature_bannerImageMediaId_key" ON "EmailSignature"("bannerImageMediaId");

-- CreateIndex
CREATE INDEX "EmailSignatureSocialLink_emailSignatureId_idx" ON "EmailSignatureSocialLink"("emailSignatureId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_emailSignaturePolicyId_key" ON "PlanPolicy"("emailSignaturePolicyId");

-- AddForeignKey
ALTER TABLE "EmailSignature" ADD CONSTRAINT "EmailSignature_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSignature" ADD CONSTRAINT "EmailSignature_profileImageMediaId_fkey" FOREIGN KEY ("profileImageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSignature" ADD CONSTRAINT "EmailSignature_companyLogoMediaId_fkey" FOREIGN KEY ("companyLogoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSignature" ADD CONSTRAINT "EmailSignature_bannerImageMediaId_fkey" FOREIGN KEY ("bannerImageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSignatureSocialLink" ADD CONSTRAINT "EmailSignatureSocialLink_emailSignatureId_fkey" FOREIGN KEY ("emailSignatureId") REFERENCES "EmailSignature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_emailSignaturePolicyId_fkey" FOREIGN KEY ("emailSignaturePolicyId") REFERENCES "EmailSignaturePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
