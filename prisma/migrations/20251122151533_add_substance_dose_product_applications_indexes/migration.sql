-- CreateIndex
CREATE INDEX "ProductApplication_productId_idx" ON "ProductApplication"("productId");

-- CreateIndex
CREATE INDEX "ProductApplication_treatmentId_idx" ON "ProductApplication"("treatmentId");

-- CreateIndex
CREATE INDEX "SubstanceDose_productId_idx" ON "SubstanceDose"("productId");

-- CreateIndex
CREATE INDEX "SubstanceDose_substanceId_idx" ON "SubstanceDose"("substanceId");
