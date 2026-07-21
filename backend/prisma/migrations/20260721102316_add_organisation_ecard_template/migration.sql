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
ALTER TABLE "EcardComponentAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardPolicy" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

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
CREATE TABLE "OrganisationEcardTemplate" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "heroName" TEXT,
    "heroEmail" TEXT,
    "heroCompanyName" TEXT,
    "heroProfilePhotoMediaId" UUID,
    "phoneCountryDialCode" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationEcardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateComponent" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "type" "ECardComponentType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationEcardTemplateComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateAboutComponent" (
    "templateComponentId" UUID NOT NULL,
    "profession" TEXT,
    "shortNote" TEXT,
    "description" TEXT,
    "aboutMe" TEXT,

    CONSTRAINT "OrganisationEcardTemplateAboutComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateSocialLinksComponent" (
    "templateComponentId" UUID NOT NULL,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "linkedIn" TEXT,

    CONSTRAINT "OrganisationEcardTemplateSocialLinksComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateWhatsAppComponent" (
    "templateComponentId" UUID NOT NULL,
    "phoneCountryDialCode" TEXT,
    "phoneNumber" TEXT,

    CONSTRAINT "OrganisationEcardTemplateWhatsAppComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateVideoComponent" (
    "templateComponentId" UUID NOT NULL,
    "title" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "OrganisationEcardTemplateVideoComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateGalleryComponent" (
    "templateComponentId" UUID NOT NULL,

    CONSTRAINT "OrganisationEcardTemplateGalleryComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateSubGallery" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "galleryComponentId" UUID NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganisationEcardTemplateSubGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateGalleryImage" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "subGalleryId" UUID NOT NULL,
    "imageMediaId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganisationEcardTemplateGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateBrochureComponent" (
    "templateComponentId" UUID NOT NULL,
    "pdfMediaId" UUID,

    CONSTRAINT "OrganisationEcardTemplateBrochureComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateTeamComponent" (
    "templateComponentId" UUID NOT NULL,
    "title" TEXT,

    CONSTRAINT "OrganisationEcardTemplateTeamComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateTeamMember" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "teamComponentId" UUID NOT NULL,
    "organisationMemberId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganisationEcardTemplateTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationEcardTemplate_organisationId_key" ON "OrganisationEcardTemplate"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationEcardTemplate_heroProfilePhotoMediaId_key" ON "OrganisationEcardTemplate"("heroProfilePhotoMediaId");

-- CreateIndex
CREATE INDEX "OrganisationEcardTemplateComponent_templateId_order_idx" ON "OrganisationEcardTemplateComponent"("templateId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationEcardTemplateComponent_templateId_type_key" ON "OrganisationEcardTemplateComponent"("templateId", "type");

-- CreateIndex
CREATE INDEX "OrganisationEcardTemplateSubGallery_galleryComponentId_idx" ON "OrganisationEcardTemplateSubGallery"("galleryComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationEcardTemplateGalleryImage_imageMediaId_key" ON "OrganisationEcardTemplateGalleryImage"("imageMediaId");

-- CreateIndex
CREATE INDEX "OrganisationEcardTemplateGalleryImage_subGalleryId_idx" ON "OrganisationEcardTemplateGalleryImage"("subGalleryId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationEcardTemplateBrochureComponent_pdfMediaId_key" ON "OrganisationEcardTemplateBrochureComponent"("pdfMediaId");

-- CreateIndex
CREATE INDEX "OrganisationEcardTemplateTeamMember_teamComponentId_idx" ON "OrganisationEcardTemplateTeamMember"("teamComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationEcardTemplateTeamMember_teamComponentId_organis_key" ON "OrganisationEcardTemplateTeamMember"("teamComponentId", "organisationMemberId");

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplate" ADD CONSTRAINT "OrganisationEcardTemplate_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplate" ADD CONSTRAINT "OrganisationEcardTemplate_heroProfilePhotoMediaId_fkey" FOREIGN KEY ("heroProfilePhotoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateComponent" ADD CONSTRAINT "OrganisationEcardTemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OrganisationEcardTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateAboutComponent" ADD CONSTRAINT "OrganisationEcardTemplateAboutComponent_templateComponentI_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateSocialLinksComponent" ADD CONSTRAINT "OrganisationEcardTemplateSocialLinksComponent_templateComp_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateWhatsAppComponent" ADD CONSTRAINT "OrganisationEcardTemplateWhatsAppComponent_templateCompone_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateVideoComponent" ADD CONSTRAINT "OrganisationEcardTemplateVideoComponent_templateComponentI_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateGalleryComponent" ADD CONSTRAINT "OrganisationEcardTemplateGalleryComponent_templateComponen_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateSubGallery" ADD CONSTRAINT "OrganisationEcardTemplateSubGallery_galleryComponentId_fkey" FOREIGN KEY ("galleryComponentId") REFERENCES "OrganisationEcardTemplateGalleryComponent"("templateComponentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateGalleryImage" ADD CONSTRAINT "OrganisationEcardTemplateGalleryImage_subGalleryId_fkey" FOREIGN KEY ("subGalleryId") REFERENCES "OrganisationEcardTemplateSubGallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateGalleryImage" ADD CONSTRAINT "OrganisationEcardTemplateGalleryImage_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateBrochureComponent" ADD CONSTRAINT "OrganisationEcardTemplateBrochureComponent_templateCompone_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateBrochureComponent" ADD CONSTRAINT "OrganisationEcardTemplateBrochureComponent_pdfMediaId_fkey" FOREIGN KEY ("pdfMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateTeamComponent" ADD CONSTRAINT "OrganisationEcardTemplateTeamComponent_templateComponentId_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateTeamMember" ADD CONSTRAINT "OrganisationEcardTemplateTeamMember_teamComponentId_fkey" FOREIGN KEY ("teamComponentId") REFERENCES "OrganisationEcardTemplateTeamComponent"("templateComponentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateTeamMember" ADD CONSTRAINT "OrganisationEcardTemplateTeamMember_organisationMemberId_fkey" FOREIGN KEY ("organisationMemberId") REFERENCES "OrganisationMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
