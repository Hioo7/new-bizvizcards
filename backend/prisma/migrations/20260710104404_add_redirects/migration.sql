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
ALTER TABLE "Lead" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "LeadFolder" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "LeadReferenceNote" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "LeadReminder" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

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
CREATE TABLE "InternalRedirectRoute" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "sourcePath" TEXT NOT NULL,
    "targetPath" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdByEmployeeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalRedirectRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalRedirectRoute" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "sourcePath" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdByEmployeeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalRedirectRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestrictedRedirectPath" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestrictedRedirectPath_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalRedirectRoute_sourcePath_key" ON "InternalRedirectRoute"("sourcePath");

-- CreateIndex
CREATE INDEX "InternalRedirectRoute_createdByEmployeeId_idx" ON "InternalRedirectRoute"("createdByEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalRedirectRoute_sourcePath_key" ON "ExternalRedirectRoute"("sourcePath");

-- CreateIndex
CREATE INDEX "ExternalRedirectRoute_createdByEmployeeId_idx" ON "ExternalRedirectRoute"("createdByEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "RestrictedRedirectPath_path_key" ON "RestrictedRedirectPath"("path");

-- AddForeignKey
ALTER TABLE "InternalRedirectRoute" ADD CONSTRAINT "InternalRedirectRoute_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalRedirectRoute" ADD CONSTRAINT "ExternalRedirectRoute_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
