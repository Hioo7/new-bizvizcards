-- CreateEnum
CREATE TYPE "ECardComponentType" AS ENUM ('ABOUT', 'SOCIAL_LINKS', 'GALLERY', 'VIDEO', 'TEAM');

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
CREATE TABLE "ECard" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdByEmployeeId" UUID,
    "heroCompanyName" TEXT,
    "heroProfilePhotoMediaId" UUID,
    "phoneCountryDialCode" TEXT,
    "phoneNumber" TEXT,
    "isExchangeContactEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ECard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ECardComponent" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "ecardId" UUID NOT NULL,
    "type" "ECardComponentType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ECardComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ECardAboutComponent" (
    "ecardComponentId" UUID NOT NULL,
    "profession" TEXT,
    "shortNote" TEXT,
    "description" TEXT,
    "aboutMe" TEXT,

    CONSTRAINT "ECardAboutComponent_pkey" PRIMARY KEY ("ecardComponentId")
);

-- CreateTable
CREATE TABLE "ECardSocialLinksComponent" (
    "ecardComponentId" UUID NOT NULL,
    "whatsapp" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "linkedIn" TEXT,

    CONSTRAINT "ECardSocialLinksComponent_pkey" PRIMARY KEY ("ecardComponentId")
);

-- CreateTable
CREATE TABLE "ECardVideoComponent" (
    "ecardComponentId" UUID NOT NULL,
    "title" TEXT,
    "videoUrl" TEXT NOT NULL,

    CONSTRAINT "ECardVideoComponent_pkey" PRIMARY KEY ("ecardComponentId")
);

-- CreateTable
CREATE TABLE "ECardGalleryComponent" (
    "ecardComponentId" UUID NOT NULL,

    CONSTRAINT "ECardGalleryComponent_pkey" PRIMARY KEY ("ecardComponentId")
);

-- CreateTable
CREATE TABLE "ECardSubGallery" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "galleryComponentId" UUID NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ECardSubGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ECardGalleryImage" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "subGalleryId" UUID NOT NULL,
    "imageMediaId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ECardGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ECardTeamComponent" (
    "ecardComponentId" UUID NOT NULL,
    "title" TEXT,

    CONSTRAINT "ECardTeamComponent_pkey" PRIMARY KEY ("ecardComponentId")
);

-- CreateTable
CREATE TABLE "ECardTeamMember" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "teamComponentId" UUID NOT NULL,
    "organisationMemberId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ECardTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ECard_customerId_key" ON "ECard"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ECard_endpoint_key" ON "ECard"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "ECard_heroProfilePhotoMediaId_key" ON "ECard"("heroProfilePhotoMediaId");

-- CreateIndex
CREATE INDEX "ECard_customerId_idx" ON "ECard"("customerId");

-- CreateIndex
CREATE INDEX "ECard_createdByEmployeeId_idx" ON "ECard"("createdByEmployeeId");

-- CreateIndex
CREATE INDEX "ECardComponent_ecardId_order_idx" ON "ECardComponent"("ecardId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ECardComponent_ecardId_type_key" ON "ECardComponent"("ecardId", "type");

-- CreateIndex
CREATE INDEX "ECardSubGallery_galleryComponentId_idx" ON "ECardSubGallery"("galleryComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "ECardGalleryImage_imageMediaId_key" ON "ECardGalleryImage"("imageMediaId");

-- CreateIndex
CREATE INDEX "ECardGalleryImage_subGalleryId_idx" ON "ECardGalleryImage"("subGalleryId");

-- CreateIndex
CREATE INDEX "ECardTeamMember_teamComponentId_idx" ON "ECardTeamMember"("teamComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "ECardTeamMember_teamComponentId_organisationMemberId_key" ON "ECardTeamMember"("teamComponentId", "organisationMemberId");

-- AddForeignKey
ALTER TABLE "ECard" ADD CONSTRAINT "ECard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECard" ADD CONSTRAINT "ECard_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECard" ADD CONSTRAINT "ECard_heroProfilePhotoMediaId_fkey" FOREIGN KEY ("heroProfilePhotoMediaId") REFERENCES "ImageMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardComponent" ADD CONSTRAINT "ECardComponent_ecardId_fkey" FOREIGN KEY ("ecardId") REFERENCES "ECard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardAboutComponent" ADD CONSTRAINT "ECardAboutComponent_ecardComponentId_fkey" FOREIGN KEY ("ecardComponentId") REFERENCES "ECardComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardSocialLinksComponent" ADD CONSTRAINT "ECardSocialLinksComponent_ecardComponentId_fkey" FOREIGN KEY ("ecardComponentId") REFERENCES "ECardComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardVideoComponent" ADD CONSTRAINT "ECardVideoComponent_ecardComponentId_fkey" FOREIGN KEY ("ecardComponentId") REFERENCES "ECardComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardGalleryComponent" ADD CONSTRAINT "ECardGalleryComponent_ecardComponentId_fkey" FOREIGN KEY ("ecardComponentId") REFERENCES "ECardComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardSubGallery" ADD CONSTRAINT "ECardSubGallery_galleryComponentId_fkey" FOREIGN KEY ("galleryComponentId") REFERENCES "ECardGalleryComponent"("ecardComponentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardGalleryImage" ADD CONSTRAINT "ECardGalleryImage_subGalleryId_fkey" FOREIGN KEY ("subGalleryId") REFERENCES "ECardSubGallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardGalleryImage" ADD CONSTRAINT "ECardGalleryImage_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "ImageMedia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardTeamComponent" ADD CONSTRAINT "ECardTeamComponent_ecardComponentId_fkey" FOREIGN KEY ("ecardComponentId") REFERENCES "ECardComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardTeamMember" ADD CONSTRAINT "ECardTeamMember_teamComponentId_fkey" FOREIGN KEY ("teamComponentId") REFERENCES "ECardTeamComponent"("ecardComponentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardTeamMember" ADD CONSTRAINT "ECardTeamMember_organisationMemberId_fkey" FOREIGN KEY ("organisationMemberId") REFERENCES "OrganisationMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
