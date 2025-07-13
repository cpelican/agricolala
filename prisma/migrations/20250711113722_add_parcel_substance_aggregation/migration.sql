-- CreateTable
CREATE TABLE "UserSubstanceAggregation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "substanceName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDoseOfProduct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsedOfPureActiveSubstance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsedOfPureActiveSubstancePerHa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyData" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubstanceAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelSubstanceAggregation" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "substanceName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDoseOfProduct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsedOfPureActiveSubstance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsedOfPureActiveSubstancePerHa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyData" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParcelSubstanceAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSubstanceAggregation_userId_year_idx" ON "UserSubstanceAggregation"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubstanceAggregation_userId_substanceId_year_key" ON "UserSubstanceAggregation"("userId", "substanceId", "year");

-- CreateIndex
CREATE INDEX "ParcelSubstanceAggregation_parcelId_year_idx" ON "ParcelSubstanceAggregation"("parcelId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelSubstanceAggregation_parcelId_substanceId_year_key" ON "ParcelSubstanceAggregation"("parcelId", "substanceId", "year");
