-- CreateTable
CREATE TABLE "_WeatherHistoryTasksParcels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WeatherHistoryTasksParcels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_WeatherHistoryTasksParcels_B_index" ON "_WeatherHistoryTasksParcels"("B");

-- AddForeignKey
ALTER TABLE "_WeatherHistoryTasksParcels" ADD CONSTRAINT "_WeatherHistoryTasksParcels_A_fkey" FOREIGN KEY ("A") REFERENCES "Parcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WeatherHistoryTasksParcels" ADD CONSTRAINT "_WeatherHistoryTasksParcels_B_fkey" FOREIGN KEY ("B") REFERENCES "WeatherHistoryTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
