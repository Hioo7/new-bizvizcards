-- CreateEnum
CREATE TYPE "ExchangeContactFieldType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'PHONE', 'EMAIL', 'LOCATION', 'MULTIPLE_CHOICE', 'DROPDOWN', 'DATE');

-- CreateEnum
CREATE TYPE "ExchangeContactFieldTag" AS ENUM ('LEAD_NAME', 'LEAD_EMAIL', 'LEAD_PHONE', 'LEAD_NOTE', 'LEAD_LOCATION', 'LEAD_COMPANY', 'LEAD_PROFESSION');

-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "BusinessEvent" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Cart" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerAccount" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerCredential" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerSession" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "CustomerVerification" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECard" ADD COLUMN     "customFormId" UUID,
ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

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
ALTER TABLE "ECardTestimonialEntry" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardVideoGalleryVideo" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardVideoSubGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardAccentColorPreset" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardComponentAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardHeroLayoutAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardIconShapeAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardPolicy" ADD COLUMN     "isCustomFormAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxCustomForms" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardThemeAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

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
ALTER TABLE "EventGuest" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EventMember" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EventPolicy" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EventTrackable" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EventTrackableDependency" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EventTrackableRedemption" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

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
ALTER TABLE "MigrationJob" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "MigrationRecord" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrderStatusHistory" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Organisation" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplate" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateComponent" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateGalleryImage" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateSubGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateTeamMember" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateTestimonialEntry" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateVideoGalleryVideo" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateVideoSubGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationInvite" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationMember" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationPolicy" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "PlanPolicy" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "PlanPurchaseHistory" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ProductMedia" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ProductUnit" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ProductUnitLink" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "RestrictedRedirectPath" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCard" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardGalleryImage" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardPolicy" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardPolicyTemplateWhitelist" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardService" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardTemplate" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "SmartCardTestimonial" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- CreateTable
CREATE TABLE "ExchangeContactForm" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID,
    "organisationId" UUID,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeContactForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormVersion" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "formId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeContactFormVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormField" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "ExchangeContactFieldType" NOT NULL,
    "tag" "ExchangeContactFieldTag",
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExchangeContactFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormFieldOption" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "fieldId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExchangeContactFormFieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormSubmission" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeContactFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormSubmissionAnswer" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "submissionId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,

    CONSTRAINT "ExchangeContactFormSubmissionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormSubmissionTextAnswer" (
    "answerId" UUID NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ExchangeContactFormSubmissionTextAnswer_pkey" PRIMARY KEY ("answerId")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormSubmissionChoiceAnswer" (
    "answerId" UUID NOT NULL,
    "selectedOptionId" UUID NOT NULL,

    CONSTRAINT "ExchangeContactFormSubmissionChoiceAnswer_pkey" PRIMARY KEY ("answerId")
);

-- CreateTable
CREATE TABLE "ExchangeContactFormSubmissionDateAnswer" (
    "answerId" UUID NOT NULL,
    "value" DATE NOT NULL,

    CONSTRAINT "ExchangeContactFormSubmissionDateAnswer_pkey" PRIMARY KEY ("answerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeContactForm_organisationId_key" ON "ExchangeContactForm"("organisationId");

-- CreateIndex
CREATE INDEX "ExchangeContactForm_customerId_idx" ON "ExchangeContactForm"("customerId");

-- CreateIndex
CREATE INDEX "ExchangeContactFormVersion_formId_idx" ON "ExchangeContactFormVersion"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeContactFormVersion_formId_versionNumber_key" ON "ExchangeContactFormVersion"("formId", "versionNumber");

-- CreateIndex
CREATE INDEX "ExchangeContactFormField_versionId_order_idx" ON "ExchangeContactFormField"("versionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeContactFormField_versionId_tag_key" ON "ExchangeContactFormField"("versionId", "tag");

-- CreateIndex
CREATE INDEX "ExchangeContactFormFieldOption_fieldId_order_idx" ON "ExchangeContactFormFieldOption"("fieldId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeContactFormSubmission_leadId_key" ON "ExchangeContactFormSubmission"("leadId");

-- CreateIndex
CREATE INDEX "ExchangeContactFormSubmission_versionId_idx" ON "ExchangeContactFormSubmission"("versionId");

-- CreateIndex
CREATE INDEX "ExchangeContactFormSubmissionAnswer_submissionId_idx" ON "ExchangeContactFormSubmissionAnswer"("submissionId");

-- CreateIndex
CREATE INDEX "ExchangeContactFormSubmissionAnswer_fieldId_idx" ON "ExchangeContactFormSubmissionAnswer"("fieldId");

-- CreateIndex
CREATE INDEX "ECard_customFormId_idx" ON "ECard"("customFormId");

-- AddForeignKey
ALTER TABLE "ECard" ADD CONSTRAINT "ECard_customFormId_fkey" FOREIGN KEY ("customFormId") REFERENCES "ExchangeContactForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactForm" ADD CONSTRAINT "ExchangeContactForm_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactForm" ADD CONSTRAINT "ExchangeContactForm_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormVersion" ADD CONSTRAINT "ExchangeContactFormVersion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "ExchangeContactForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormField" ADD CONSTRAINT "ExchangeContactFormField_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ExchangeContactFormVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormFieldOption" ADD CONSTRAINT "ExchangeContactFormFieldOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "ExchangeContactFormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmission" ADD CONSTRAINT "ExchangeContactFormSubmission_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ExchangeContactFormVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmission" ADD CONSTRAINT "ExchangeContactFormSubmission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmissionAnswer" ADD CONSTRAINT "ExchangeContactFormSubmissionAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExchangeContactFormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmissionAnswer" ADD CONSTRAINT "ExchangeContactFormSubmissionAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "ExchangeContactFormField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmissionTextAnswer" ADD CONSTRAINT "ExchangeContactFormSubmissionTextAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ExchangeContactFormSubmissionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmissionChoiceAnswer" ADD CONSTRAINT "ExchangeContactFormSubmissionChoiceAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ExchangeContactFormSubmissionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmissionChoiceAnswer" ADD CONSTRAINT "ExchangeContactFormSubmissionChoiceAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "ExchangeContactFormFieldOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeContactFormSubmissionDateAnswer" ADD CONSTRAINT "ExchangeContactFormSubmissionDateAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ExchangeContactFormSubmissionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce "at most one current version per form" at the DB level, as a
-- backstop to ExchangeContactFormsService's transactional unset-then-set.
-- Prisma's schema DSL has no partial-unique-index syntax, hence the hand
-- edit — same pattern as the Plan_isFallbackPlan_true_unique index.
CREATE UNIQUE INDEX "ExchangeContactFormVersion_formId_isCurrent_true_unique" ON "ExchangeContactFormVersion" ("formId") WHERE "isCurrent" = true;
