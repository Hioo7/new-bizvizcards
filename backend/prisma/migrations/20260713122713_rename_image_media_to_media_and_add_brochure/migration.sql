-- Rename the generic media storage table/enum in place (not drop+recreate)
-- so existing rows and every FK pointing at them (Customer.pfpMedia,
-- SmartCard* images, ECard hero/gallery images) survive untouched.
ALTER TABLE "ImageMedia" RENAME TO "Media";
ALTER TYPE "ImageSource" RENAME TO "MediaSource";

-- AlterEnum
ALTER TYPE "ECardComponentType" ADD VALUE 'BROCHURE';

-- CreateTable
CREATE TABLE "ECardBrochureComponent" (
    "ecardComponentId" UUID NOT NULL,
    "pdfMediaId" UUID NOT NULL,

    CONSTRAINT "ECardBrochureComponent_pkey" PRIMARY KEY ("ecardComponentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ECardBrochureComponent_pdfMediaId_key" ON "ECardBrochureComponent"("pdfMediaId");

-- AddForeignKey
ALTER TABLE "ECardBrochureComponent" ADD CONSTRAINT "ECardBrochureComponent_ecardComponentId_fkey" FOREIGN KEY ("ecardComponentId") REFERENCES "ECardComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECardBrochureComponent" ADD CONSTRAINT "ECardBrochureComponent_pdfMediaId_fkey" FOREIGN KEY ("pdfMediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
