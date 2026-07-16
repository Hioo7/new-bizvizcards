-- CreateTable
CREATE TABLE "EventTrackableDependency" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "trackableId" UUID NOT NULL,
    "dependsOnTrackableId" UUID NOT NULL,

    CONSTRAINT "EventTrackableDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventTrackableDependency_trackableId_idx" ON "EventTrackableDependency"("trackableId");

-- CreateIndex
CREATE INDEX "EventTrackableDependency_dependsOnTrackableId_idx" ON "EventTrackableDependency"("dependsOnTrackableId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTrackableDependency_trackableId_dependsOnTrackableId_key" ON "EventTrackableDependency"("trackableId", "dependsOnTrackableId");

-- AddForeignKey
ALTER TABLE "EventTrackableDependency" ADD CONSTRAINT "EventTrackableDependency_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "EventTrackable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTrackableDependency" ADD CONSTRAINT "EventTrackableDependency_dependsOnTrackableId_fkey" FOREIGN KEY ("dependsOnTrackableId") REFERENCES "EventTrackable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
