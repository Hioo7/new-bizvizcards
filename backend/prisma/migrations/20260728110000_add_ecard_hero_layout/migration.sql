-- CreateEnum
CREATE TYPE "ECardHeroLayout" AS ENUM ('DEFAULT', 'BANNER', 'BANNER_PROFILE', 'ORG_BADGE');

-- AlterTable
ALTER TABLE "ECard" ADD COLUMN     "heroBadgeFallbackColor" TEXT,
ADD COLUMN     "heroBannerFallbackColor" TEXT,
ADD COLUMN     "heroBannerMediaId" UUID,
ADD COLUMN     "heroLayout" "ECardHeroLayout" NOT NULL DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE "OrganisationEcardTemplate" ADD COLUMN     "heroBadgeFallbackColor" TEXT,
ADD COLUMN     "heroBannerFallbackColor" TEXT,
ADD COLUMN     "heroBannerMediaId" UUID,
ADD COLUMN     "heroLayout" "ECardHeroLayout";

-- CreateTable
CREATE TABLE "EcardHeroLayoutAvailability" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "ecardPolicyId" UUID NOT NULL,
    "layout" "ECardHeroLayout" NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EcardHeroLayoutAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EcardHeroLayoutAvailability_ecardPolicyId_layout_key" ON "EcardHeroLayoutAvailability"("ecardPolicyId", "layout");

-- CreateIndex
CREATE UNIQUE INDEX "ECard_heroBannerMediaId_key" ON "ECard"("heroBannerMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationEcardTemplate_heroBannerMediaId_key" ON "OrganisationEcardTemplate"("heroBannerMediaId");

-- AddForeignKey
ALTER TABLE "ECard" ADD CONSTRAINT "ECard_heroBannerMediaId_fkey" FOREIGN KEY ("heroBannerMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationEcardTemplate" ADD CONSTRAINT "OrganisationEcardTemplate_heroBannerMediaId_fkey" FOREIGN KEY ("heroBannerMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcardHeroLayoutAvailability" ADD CONSTRAINT "EcardHeroLayoutAvailability_ecardPolicyId_fkey" FOREIGN KEY ("ecardPolicyId") REFERENCES "EcardPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
