-- AlterTable
ALTER TABLE "Parcel" ADD COLUMN "boundary" JSONB;
ALTER TABLE "Parcel" ADD COLUMN "areaM2" DOUBLE PRECISION;

-- Backfill area from legacy width × height
UPDATE "Parcel" SET "areaM2" = "width" * "height" WHERE "areaM2" IS NULL;
