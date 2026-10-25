-- CreateTable
CREATE TABLE "ParcelMember" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParcelMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParcelMember_userId_idx" ON "ParcelMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelMember_parcelId_userId_key" ON "ParcelMember"("parcelId", "userId");

-- AddForeignKey
ALTER TABLE "ParcelMember" ADD CONSTRAINT "ParcelMember_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelMember" ADD CONSTRAINT "ParcelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill (hand-written, see design-docs/shared-parcels.md Q1): every existing parcel's creator becomes its first member
INSERT INTO "ParcelMember" ("id", "parcelId", "userId")
SELECT gen_random_uuid()::text, "id", "userId" FROM "Parcel"
ON CONFLICT ("parcelId", "userId") DO NOTHING;
