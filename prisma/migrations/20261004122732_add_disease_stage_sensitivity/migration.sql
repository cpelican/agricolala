-- CreateEnum
CREATE TYPE "DiseaseSensitivityLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateTable
CREATE TABLE "DiseaseStageSensitivity" (
    "id" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "stage" "PhenologicalStage" NOT NULL,
    "level" "DiseaseSensitivityLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiseaseStageSensitivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiseaseStageSensitivity_diseaseId_stage_key" ON "DiseaseStageSensitivity"("diseaseId", "stage");

-- AddForeignKey
ALTER TABLE "DiseaseStageSensitivity" ADD CONSTRAINT "DiseaseStageSensitivity_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
