-- CreateTable
CREATE TABLE "WeatherHistoryTask" (
    "id" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherHistoryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherHistory" (
    "id" SERIAL NOT NULL,
    "cityName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "temperature2mMin" DOUBLE PRECISION,
    "temperature2mMax" DOUBLE PRECISION,
    "relative_humidity_2mMin" DOUBLE PRECISION,
    "relative_humidity_2mMax" DOUBLE PRECISION,
    "wind_speed_median" DOUBLE PRECISION,
    "temperature80mMin" DOUBLE PRECISION,
    "temperature80mMax" DOUBLE PRECISION,
    "cumulativePrecipitation" DOUBLE PRECISION,

    CONSTRAINT "WeatherHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WeatherHistoryParcels" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_WeatherHistoryParcels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHistory_dateTime_key" ON "WeatherHistory"("dateTime");

-- CreateIndex
CREATE INDEX "_WeatherHistoryParcels_B_index" ON "_WeatherHistoryParcels"("B");

-- AddForeignKey
ALTER TABLE "_WeatherHistoryParcels" ADD CONSTRAINT "_WeatherHistoryParcels_A_fkey" FOREIGN KEY ("A") REFERENCES "Parcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WeatherHistoryParcels" ADD CONSTRAINT "_WeatherHistoryParcels_B_fkey" FOREIGN KEY ("B") REFERENCES "WeatherHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
