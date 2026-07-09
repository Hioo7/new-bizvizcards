-- CreateEnum
CREATE TYPE "SmartCardTemplateKey" AS ENUM ('INTERIOR_DESIGN_TEMPLATE', 'INTERIOR_DESIGN_TEMPLATE_2', 'INTERIOR_DESIGN_TEMPLATE_3');

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

-- CreateTable
CREATE TABLE "SmartCardTemplate" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "key" "SmartCardTemplateKey" NOT NULL,
    "name" TEXT NOT NULL,
    "previewMediaId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartCardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartCard" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "customerId" UUID,
    "templateId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdByEmployeeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartCardProfile" (
    "smartCardId" UUID NOT NULL,
    "companyName" TEXT,
    "tagline" TEXT,
    "subTagline" TEXT,
    "aboutText" TEXT,
    "logoMediaId" UUID,

    CONSTRAINT "SmartCardProfile_pkey" PRIMARY KEY ("smartCardId")
);

-- CreateTable
CREATE TABLE "SmartCardContact" (
    "smartCardId" UUID NOT NULL,
    "contactNumber" TEXT,
    "email" TEXT,
    "address" TEXT,

    CONSTRAINT "SmartCardContact_pkey" PRIMARY KEY ("smartCardId")
);

-- CreateTable
CREATE TABLE "SmartCardSocialMedia" (
    "smartCardId" UUID NOT NULL,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "linkedIn" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "googleMap" TEXT,
    "website" TEXT,
    "other" TEXT,

    CONSTRAINT "SmartCardSocialMedia_pkey" PRIMARY KEY ("smartCardId")
);

-- CreateTable
CREATE TABLE "SmartCardFounder" (
    "smartCardId" UUID NOT NULL,
    "name" TEXT,
    "title" TEXT,
    "imageMediaId" UUID,
    "experience" INTEGER,
    "projects" INTEGER,
    "satisfaction" INTEGER,
    "introText" TEXT,
    "philosophyText" TEXT,
    "quote" TEXT,

    CONSTRAINT "SmartCardFounder_pkey" PRIMARY KEY ("smartCardId")
);

-- CreateTable
CREATE TABLE "SmartCardService" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "smartCardId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageMediaId" UUID,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SmartCardService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartCardTestimonial" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "smartCardId" UUID NOT NULL,
    "name" TEXT,
    "initials" TEXT,
    "text" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SmartCardTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartCardGallery" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "smartCardId" UUID NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SmartCardGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartCardGalleryImage" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "galleryId" UUID NOT NULL,
    "imageMediaId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SmartCardGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartCardTemplate_key_key" ON "SmartCardTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SmartCardTemplate_previewMediaId_key" ON "SmartCardTemplate"("previewMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartCard_endpoint_key" ON "SmartCard"("endpoint");

-- CreateIndex
CREATE INDEX "SmartCard_customerId_idx" ON "SmartCard"("customerId");

-- CreateIndex
CREATE INDEX "SmartCard_templateId_idx" ON "SmartCard"("templateId");

-- CreateIndex
CREATE INDEX "SmartCard_createdByEmployeeId_idx" ON "SmartCard"("createdByEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartCardProfile_logoMediaId_key" ON "SmartCardProfile"("logoMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartCardFounder_imageMediaId_key" ON "SmartCardFounder"("imageMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartCardService_imageMediaId_key" ON "SmartCardService"("imageMediaId");

-- CreateIndex
CREATE INDEX "SmartCardService_smartCardId_idx" ON "SmartCardService"("smartCardId");

-- CreateIndex
CREATE INDEX "SmartCardTestimonial_smartCardId_idx" ON "SmartCardTestimonial"("smartCardId");

-- CreateIndex
CREATE INDEX "SmartCardGallery_smartCardId_idx" ON "SmartCardGallery"("smartCardId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartCardGalleryImage_imageMediaId_key" ON "SmartCardGalleryImage"("imageMediaId");

-- CreateIndex
CREATE INDEX "SmartCardGalleryImage_galleryId_idx" ON "SmartCardGalleryImage"("galleryId");

-- AddForeignKey
ALTER TABLE "SmartCardTemplate" ADD CONSTRAINT "SmartCardTemplate_previewMediaId_fkey" FOREIGN KEY ("previewMediaId") REFERENCES "ImageMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCard" ADD CONSTRAINT "SmartCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCard" ADD CONSTRAINT "SmartCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SmartCardTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCard" ADD CONSTRAINT "SmartCard_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardProfile" ADD CONSTRAINT "SmartCardProfile_smartCardId_fkey" FOREIGN KEY ("smartCardId") REFERENCES "SmartCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardProfile" ADD CONSTRAINT "SmartCardProfile_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "ImageMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardContact" ADD CONSTRAINT "SmartCardContact_smartCardId_fkey" FOREIGN KEY ("smartCardId") REFERENCES "SmartCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardSocialMedia" ADD CONSTRAINT "SmartCardSocialMedia_smartCardId_fkey" FOREIGN KEY ("smartCardId") REFERENCES "SmartCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardFounder" ADD CONSTRAINT "SmartCardFounder_smartCardId_fkey" FOREIGN KEY ("smartCardId") REFERENCES "SmartCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardFounder" ADD CONSTRAINT "SmartCardFounder_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "ImageMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardService" ADD CONSTRAINT "SmartCardService_smartCardId_fkey" FOREIGN KEY ("smartCardId") REFERENCES "SmartCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardService" ADD CONSTRAINT "SmartCardService_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "ImageMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardTestimonial" ADD CONSTRAINT "SmartCardTestimonial_smartCardId_fkey" FOREIGN KEY ("smartCardId") REFERENCES "SmartCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardGallery" ADD CONSTRAINT "SmartCardGallery_smartCardId_fkey" FOREIGN KEY ("smartCardId") REFERENCES "SmartCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardGalleryImage" ADD CONSTRAINT "SmartCardGalleryImage_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "SmartCardGallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartCardGalleryImage" ADD CONSTRAINT "SmartCardGalleryImage_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "ImageMedia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
