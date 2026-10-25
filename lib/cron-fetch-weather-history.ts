import { prisma } from "./prisma";
import {
	getEnabledWeatherHistoryTasks,
	getWeatherHistoryTaskParcelIds,
} from "./data-fetcher";
import { OpenMeteoClient } from "./open-meteo-client";
import {
	WEATHER_HISTORY_DAYS,
	getStartOfUtcDay,
	subtractUtcDays,
} from "./open-meteo-schema";
import {
	adoptLegacyWeatherRows,
	getMissingDays,
	getStoredWeatherDays,
	getWeatherSeasonStart,
	saveWeatherDays,
} from "./weather-history";

// Saves the last week of weather for every enabled task and backfills the
// season's missing days. A failing task does not stop the others.
export async function fetchWeatherHistory() {
	const tasks = await getEnabledWeatherHistoryTasks();

	return await Promise.all(
		tasks.map(async (task) => {
			try {
				const parcelIds = await getWeatherHistoryTaskParcelIds(task.id);

				await adoptLegacyWeatherRows(prisma, task);

				const dailyData = await OpenMeteoClient.getHistoryWeatherData(
					task.latitude,
					task.longitude,
				);
				await saveWeatherDays(prisma, task, parcelIds, dailyData);

				// Fill the days since 1 March that the last week doesn't cover: a task
				// created mid-season, or a cron outage longer than a week.
				const todayStart = getStartOfUtcDay(new Date());
				const recentStart = subtractUtcDays(todayStart, WEATHER_HISTORY_DAYS);
				const seasonStart = getWeatherSeasonStart(todayStart);
				const missingDays = getMissingDays(
					await getStoredWeatherDays(prisma, task.id, seasonStart, recentStart),
					seasonStart,
					recentStart,
				);
				let backfilledCount = 0;
				if (missingDays.length > 0) {
					const missing = new Set(missingDays.map((day) => day.getTime()));
					const backfill = (
						await OpenMeteoClient.getHistoryWeatherDataBetween(
							task.latitude,
							task.longitude,
							missingDays[0],
							missingDays[missingDays.length - 1],
						)
					).filter((daily) => missing.has(daily.date.getTime()));
					await saveWeatherDays(prisma, task, parcelIds, backfill);
					backfilledCount = backfill.length;
				}

				return {
					success: true as const,
					entriesCreated: dailyData.length + backfilledCount,
				};
			} catch (error) {
				const errorMessage = `Error processing task ${task.id} (${task.cityName}): ${
					error instanceof Error ? error.message : String(error)
				}`;
				console.error(errorMessage, error);
				return { success: false as const, errorMessage };
			}
		}),
	);
}
