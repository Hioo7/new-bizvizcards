-- AlterEnum
ALTER TYPE "ECardComponentType" ADD VALUE 'VIDEO_GALLERY';

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
ALTER TABLE "ECardGalleryImage" ADD COLUMN     "caption" VARCHAR(100),
ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardSubGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "ECardTeamMember" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardAccentColorPreset" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardComponentAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardHeroLayoutAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardIconShapeAvailability" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "EcardPolicy" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

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
ALTER TABLE "OrganisationEcardTemplateGalleryImage" ADD COLUMN     "caption" VARCHAR(100),
ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateSubGallery" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganisationEcardTemplateTeamMember" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

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
CREATE TABLE "ECardVideoGalleryComponent" (
    "ecardComponentId" UUID NOT NULL,

    CONSTRAINT "ECardVideoGalleryComponent_pkey" PRIMARY KEY ("ecardComponentId")
);

-- CreateTable
CREATE TABLE "ECardVideoSubGallery" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "videoGalleryComponentId" UUID NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ECardVideoSubGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ECardVideoGalleryVideo" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "subGalleryId" UUID NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "caption" VARCHAR(100),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ECardVideoGalleryVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateVideoGalleryComponent" (
    "templateComponentId" UUID NOT NULL,

    CONSTRAINT "OrganisationEcardTemplateVideoGalleryComponent_pkey" PRIMARY KEY ("templateComponentId")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateVideoSubGallery" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "videoGalleryComponentId" UUID NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganisationEcardTemplateVideoSubGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationEcardTemplateVideoGalleryVideo" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "subGalleryId" UUID NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "caption" VARCHAR(100),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganisationEcardTemplateVideoGalleryVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoGalleryComponentLimits" (
    "ecardComponentAvailabilityId" UUID NOT NULL,
    "maxVideoGalleries" INTEGER NOT NULL,
    "maxVideosPerGallery" INTEGER NOT NULL,

    CONSTRAINT "VideoGalleryComponentLimits_pkey" PRIMARY KEY ("ecardComponentAvailabilityId")
);

-- CreateIndex
CREATE INDEX "ECardVideoSubGallery_videoGalleryComponentId_idx" ON "ECardVideoSubGallery"("videoGalleryComponentId");

-- CreateIndex
CREATE INDEX "ECardVideoGalleryVideo_subGalleryId_idx" ON "ECardVideoGalleryVideo"("subGalleryId");

-- CreateIndex
CREATE INDEX "OrganisationEcardTemplateVideoSubGallery_videoGalleryCompon_idx" ON "OrganisationEcardTemplateVideoSubGallery"("videoGalleryComponentId");

-- CreateIndex
CREATE INDEX "OrganisationEcardTemplateVideoGalleryVideo_subGalleryId_idx" ON "OrganisationEcardTemplateVideoGalleryVideo"("subGalleryId");

-- AddForeignKey
ALTER TABLE "ECardVideoGalleryComponent" ADD CONSTRAINT "ECardVideoGalleryComponent_ecardComponentId_fkey" FOREIGN KEY ("ecardComponentId") REFERENCES "ECardComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardVideoSubGallery" ADD CONSTRAINT "ECardVideoSubGallery_videoGalleryComponentId_fkey" FOREIGN KEY ("videoGalleryComponentId") REFERENCES "ECardVideoGalleryComponent"("ecardComponentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardVideoGalleryVideo" ADD CONSTRAINT "ECardVideoGalleryVideo_subGalleryId_fkey" FOREIGN KEY ("subGalleryId") REFERENCES "ECardVideoSubGallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateVideoGalleryComponent" ADD CONSTRAINT "OrganisationEcardTemplateVideoGalleryComponent_templateCom_fkey" FOREIGN KEY ("templateComponentId") REFERENCES "OrganisationEcardTemplateComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateVideoSubGallery" ADD CONSTRAINT "OrganisationEcardTemplateVideoSubGallery_videoGalleryCompo_fkey" FOREIGN KEY ("videoGalleryComponentId") REFERENCES "OrganisationEcardTemplateVideoGalleryComponent"("templateComponentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplateVideoGalleryVideo" ADD CONSTRAINT "OrganisationEcardTemplateVideoGalleryVideo_subGalleryId_fkey" FOREIGN KEY ("subGalleryId") REFERENCES "OrganisationEcardTemplateVideoSubGallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoGalleryComponentLimits" ADD CONSTRAINT "VideoGalleryComponentLimits_ecardComponentAvailabilityId_fkey" FOREIGN KEY ("ecardComponentAvailabilityId") REFERENCES "EcardComponentAvailability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
