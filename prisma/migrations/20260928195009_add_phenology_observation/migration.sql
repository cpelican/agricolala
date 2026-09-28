-- CreateEnum
CREATE TYPE "PhenologicalStage" AS ENUM ('BUD_BREAK', 'LEAVES_UNFOLDING', 'FLOWER_CLUSTERS', 'FLOWERING', 'FRUIT_SET', 'BUNCH_CLOSURE', 'VERAISON', 'RIPE');

-- CreateTable
CREATE TABLE "PhenologyObservation" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "stage" "PhenologicalStage" NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhenologyObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhenologyObservation_parcelId_observedAt_idx" ON "PhenologyObservation"("parcelId", "observedAt");

-- AddForeignKey
ALTER TABLE "PhenologyObservation" ADD CONSTRAINT "PhenologyObservation_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
