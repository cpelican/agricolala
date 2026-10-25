import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/constants";
import { OpenMeteoClient } from "@/lib/open-meteo-client";
import {
	WEATHER_HISTORY_DAYS,
	getStartOfUtcDay,
	subtractUtcDays,
} from "@/lib/open-meteo-schema";
import {
	adoptLegacyWeatherRows,
	getMissingDays,
	getStoredWeatherDays,
	getWeatherSeasonStart,
	saveWeatherDays,
} from "@/lib/weather-history";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 401 });
	}

	try {
		const tasks = await prisma.weatherHistoryTask.findMany({
			where: {
				enabled: true,
			},
		});

		const taskResults = await Promise.all(
			tasks.map(async (task) => {
				try {
					// Fetch parcels associated with this task
					const parcels = await prisma.parcel.findMany({
						where: {
							weatherHistoryTasks: {
								some: {
									id: task.id,
								},
							},
						},
						select: {
							id: true,
						},
					});
					const parcelIds = parcels.map((parcel) => parcel.id);

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
						await getStoredWeatherDays(
							prisma,
							task.id,
							seasonStart,
							recentStart,
						),
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

		let totalEntriesCreated = 0;
		let tasksProcessed = 0;
		const errors: string[] = [];

		for (const result of taskResults) {
			if (result.success) {
				tasksProcessed++;
				totalEntriesCreated += result.entriesCreated;
			} else {
				errors.push(result.errorMessage);
			}
		}

		return NextResponse.json({
			success: true,
			message: `Processed ${tasksProcessed} tasks and created/updated ${totalEntriesCreated} weather history entries`,
			tasksProcessed,
			totalEntriesCreated,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("Error in weather history cron job:", error);
		return NextResponse.json(
			{
				error: Errors.INTERNAL_SERVER,
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 },
		);
	}
}
