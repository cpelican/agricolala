-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_parcel_user_id" ON "Parcel"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_treatment_parcel_id" ON "Treatment"("parcelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_treatment_user_id" ON "Treatment"("userId");
