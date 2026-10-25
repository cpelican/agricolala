-- DropIndex
DROP INDEX "WeatherHistory_dateTime_key";

-- AlterTable
ALTER TABLE "WeatherHistory" ADD COLUMN     "weatherHistoryTaskId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHistory_weatherHistoryTaskId_dateTime_key" ON "WeatherHistory"("weatherHistoryTaskId", "dateTime");

-- AddForeignKey
ALTER TABLE "WeatherHistory" ADD CONSTRAINT "WeatherHistory_weatherHistoryTaskId_fkey" FOREIGN KEY ("weatherHistoryTaskId") REFERENCES "WeatherHistoryTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

