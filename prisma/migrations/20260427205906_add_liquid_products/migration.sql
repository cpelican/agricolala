-- CreateEnum
CREATE TYPE "ProductDoseUnit" AS ENUM ('GRAM', 'MILLILITER');

-- CreateEnum
CREATE TYPE "SubstanceLimitUnit" AS ENUM ('KG_PER_HA');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "doseUnit" "ProductDoseUnit" NOT NULL DEFAULT 'GRAM',
ADD COLUMN     "productLiterToKiloGramConversionRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Substance" ADD COLUMN     "maxDosageUnitPerAreaUnit" "SubstanceLimitUnit" NOT NULL DEFAULT 'KG_PER_HA';
