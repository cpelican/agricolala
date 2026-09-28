-- CreateEnum
CREATE TYPE "PhenologicalStage" AS ENUM ('BUD_BREAK', 'LEAVES_UNFOLDING', 'FLOWER_CLUSTERS', 'FLOWERING', 'FRUIT_SET', 'BUNCH_CLOSURE', 'VERAISON', 'RIPE');

-- CreateTable
CREATE TABLE "PhenologyObservation" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" "PhenologicalStage" NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "treatmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhenologyObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhenologyObservation_parcelId_observedAt_idx" ON "PhenologyObservation"("parcelId", "observedAt");

-- CreateIndex
CREATE INDEX "PhenologyObservation_userId_idx" ON "PhenologyObservation"("userId");

-- CreateIndex
CREATE INDEX "PhenologyObservation_treatmentId_idx" ON "PhenologyObservation"("treatmentId");

-- AddForeignKey
ALTER TABLE "PhenologyObservation" ADD CONSTRAINT "PhenologyObservation_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhenologyObservation" ADD CONSTRAINT "PhenologyObservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhenologyObservation" ADD CONSTRAINT "PhenologyObservation_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
