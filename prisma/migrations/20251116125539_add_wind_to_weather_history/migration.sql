/*
  Warnings:

  - You are about to drop the column `wind_speed_median` on the `WeatherHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WeatherHistory" DROP COLUMN "wind_speed_median",
ADD COLUMN     "wind_speed_10mMax" DOUBLE PRECISION,
ADD COLUMN     "wind_speed_10mMin" DOUBLE PRECISION,
ADD COLUMN     "wind_speed_180mMax" DOUBLE PRECISION,
ADD COLUMN     "wind_speed_180mMin" DOUBLE PRECISION;
