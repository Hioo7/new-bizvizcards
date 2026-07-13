-- CreateEnum
CREATE TYPE "OrganisationMemberRole" AS ENUM ('SPOC', 'MEMBER');

-- CreateEnum
CREATE TYPE "OrganisationMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrganisationInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

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
CREATE TABLE "Organisation" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdByCustomerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationMember" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "role" "OrganisationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "OrganisationMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganisationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationInvite" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrganisationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "status" "OrganisationInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedByCustomerId" UUID NOT NULL,
    "acceptedByCustomerId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationMember_customerId_key" ON "OrganisationMember"("customerId");

-- CreateIndex
CREATE INDEX "OrganisationMember_organisationId_idx" ON "OrganisationMember"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationInvite_token_key" ON "OrganisationInvite"("token");

-- CreateIndex
CREATE INDEX "OrganisationInvite_organisationId_idx" ON "OrganisationInvite"("organisationId");

-- CreateIndex
CREATE INDEX "OrganisationInvite_email_idx" ON "OrganisationInvite"("email");

-- AddForeignKey
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_createdByCustomerId_fkey" FOREIGN KEY ("createdByCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationInvite" ADD CONSTRAINT "OrganisationInvite_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationInvite" ADD CONSTRAINT "OrganisationInvite_invitedByCustomerId_fkey" FOREIGN KEY ("invitedByCustomerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationInvite" ADD CONSTRAINT "OrganisationInvite_acceptedByCustomerId_fkey" FOREIGN KEY ("acceptedByCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
