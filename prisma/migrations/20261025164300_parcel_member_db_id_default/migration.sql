-- AlterTable
ALTER TABLE "ParcelMember" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
