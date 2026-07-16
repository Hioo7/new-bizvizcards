-- CreateEnum
CREATE TYPE "PlanBusinessModelType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'TRIAL');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "currentPlanId" UUID,
ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerAccount" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerCredential" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerSession" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerVerification" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECard" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardComponent" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardEvent" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardGalleryImage" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardSubGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardTeamMember" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EmployeeAccount" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EmployeeCredential" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EmployeeSession" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EmployeeVerification" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ExternalRedirectRoute" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "InternalRedirectRoute" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "LeadFolder" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "LeadReferenceNote" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "LeadReminder" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Organisation" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationInvite" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationMember" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "RestrictedRedirectPath" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCard" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardGalleryImage" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardService" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardTemplate" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardTestimonial" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "businessModelType" "PlanBusinessModelType" NOT NULL,
    "subscriptionDurationMonths" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFallbackPlan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "planId" UUID NOT NULL,
    "ecardPolicyId" UUID NOT NULL,
    "smartCardPolicyId" UUID NOT NULL,
    "organisationPolicyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcardPolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxEcards" INTEGER NOT NULL DEFAULT 0,
    "exchangeContactAccess" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EcardPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcardComponentAvailability" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "ecardPolicyId" UUID NOT NULL,
    "type" "ECardComponentType" NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EcardComponentAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryComponentLimits" (
    "ecardComponentAvailabilityId" UUID NOT NULL,
    "maxGalleries" INTEGER NOT NULL,
    "maxImagesPerGallery" INTEGER NOT NULL,
    "maxGallerySizeBytes" INTEGER NOT NULL,

    CONSTRAINT "GalleryComponentLimits_pkey" PRIMARY KEY ("ecardComponentAvailabilityId")
);

-- CreateTable
CREATE TABLE "SmartCardPolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxSmartCards" INTEGER NOT NULL DEFAULT 0,
    "exchangeContactAccess" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SmartCardPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartCardPolicyTemplateWhitelist" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "smartCardPolicyId" UUID NOT NULL,
    "templateId" UUID NOT NULL,

    CONSTRAINT "SmartCardPolicyTemplateWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationPolicy" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxOrgsCanJoin" INTEGER NOT NULL DEFAULT 0,
    "maxOrgsCanCreate" INTEGER NOT NULL DEFAULT 0,
    "orgEcardPolicyId" UUID NOT NULL,
    "orgSmartCardPolicyId" UUID NOT NULL,

    CONSTRAINT "OrganisationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPurchaseHistory" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "assignedByEmployeeId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "businessModelTypeAtPurchase" "PlanBusinessModelType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanPurchaseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_planId_key" ON "PlanPolicy"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_ecardPolicyId_key" ON "PlanPolicy"("ecardPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_smartCardPolicyId_key" ON "PlanPolicy"("smartCardPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPolicy_organisationPolicyId_key" ON "PlanPolicy"("organisationPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "EcardComponentAvailability_ecardPolicyId_type_key" ON "EcardComponentAvailability"("ecardPolicyId", "type");

-- CreateIndex
CREATE INDEX "SmartCardPolicyTemplateWhitelist_smartCardPolicyId_idx" ON "SmartCardPolicyTemplateWhitelist"("smartCardPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartCardPolicyTemplateWhitelist_smartCardPolicyId_template_key" ON "SmartCardPolicyTemplateWhitelist"("smartCardPolicyId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationPolicy_orgEcardPolicyId_key" ON "OrganisationPolicy"("orgEcardPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationPolicy_orgSmartCardPolicyId_key" ON "OrganisationPolicy"("orgSmartCardPolicyId");

-- CreateIndex
CREATE INDEX "PlanPurchaseHistory_customerId_idx" ON "PlanPurchaseHistory"("customerId");

-- CreateIndex
CREATE INDEX "PlanPurchaseHistory_planId_idx" ON "PlanPurchaseHistory"("planId");

-- CreateIndex
CREATE INDEX "PlanPurchaseHistory_customerId_planId_idx" ON "PlanPurchaseHistory"("customerId", "planId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_currentPlanId_fkey" FOREIGN KEY ("currentPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_ecardPolicyId_fkey" FOREIGN KEY ("ecardPolicyId") REFERENCES "EcardPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_smartCardPolicyId_fkey" FOREIGN KEY ("smartCardPolicyId") REFERENCES "SmartCardPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPolicy" ADD CONSTRAINT "PlanPolicy_organisationPolicyId_fkey" FOREIGN KEY ("organisationPolicyId") REFERENCES "OrganisationPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcardComponentAvailability" ADD CONSTRAINT "EcardComponentAvailability_ecardPolicyId_fkey" FOREIGN KEY ("ecardPolicyId") REFERENCES "EcardPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryComponentLimits" ADD CONSTRAINT "GalleryComponentLimits_ecardComponentAvailabilityId_fkey" FOREIGN KEY ("ecardComponentAvailabilityId") REFERENCES "EcardComponentAvailability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardPolicyTemplateWhitelist" ADD CONSTRAINT "SmartCardPolicyTemplateWhitelist_smartCardPolicyId_fkey" FOREIGN KEY ("smartCardPolicyId") REFERENCES "SmartCardPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardPolicyTemplateWhitelist" ADD CONSTRAINT "SmartCardPolicyTemplateWhitelist_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SmartCardTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationPolicy" ADD CONSTRAINT "OrganisationPolicy_orgEcardPolicyId_fkey" FOREIGN KEY ("orgEcardPolicyId") REFERENCES "EcardPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationPolicy" ADD CONSTRAINT "OrganisationPolicy_orgSmartCardPolicyId_fkey" FOREIGN KEY ("orgSmartCardPolicyId") REFERENCES "SmartCardPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPurchaseHistory" ADD CONSTRAINT "PlanPurchaseHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPurchaseHistory" ADD CONSTRAINT "PlanPurchaseHistory_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPurchaseHistory" ADD CONSTRAINT "PlanPurchaseHistory_assignedByEmployeeId_fkey" FOREIGN KEY ("assignedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
