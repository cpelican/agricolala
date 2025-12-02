import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/constants";
import { OpenMeteoClient } from "@/lib/openMeteoClient";

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

		let totalEntriesCreated = 0;
		let tasksProcessed = 0;
		const errors: string[] = [];

		for (const task of tasks) {
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

				const dailyData = await OpenMeteoClient.getHistoryWeatherData(
					task.latitude,
					task.longitude,
				);

				for (const daily of dailyData) {
					await prisma.weatherHistory.upsert({
						where: {
							dateTime: daily.date,
						},
						update: {
							cityName: task.cityName,
							latitude: task.latitude,
							longitude: task.longitude,
							temperature2mMin: daily.temperature2mMin,
							temperature2mMax: daily.temperature2mMax,
							temperature80mMin: daily.temperature80mMin,
							temperature80mMax: daily.temperature80mMax,
							relative_humidity_2mMin: daily.relative_humidity_2mMin,
							relative_humidity_2mMax: daily.relative_humidity_2mMax,
							wind_speed_10mMin: daily.wind_speed_10mMin,
							wind_speed_10mMax: daily.wind_speed_10mMax,
							wind_speed_180mMin: daily.wind_speed_180mMin,
							wind_speed_180mMax: daily.wind_speed_180mMax,
							cumulativePrecipitation: daily.cumulativePrecipitation,
							...(parcelIds.length > 0 && {
								parcels: {
									set: parcelIds.map((id) => ({ id })),
								},
							}),
						},
						create: {
							cityName: task.cityName,
							latitude: task.latitude,
							longitude: task.longitude,
							dateTime: daily.date,
							temperature2mMin: daily.temperature2mMin,
							temperature2mMax: daily.temperature2mMax,
							temperature80mMin: daily.temperature80mMin,
							temperature80mMax: daily.temperature80mMax,
							relative_humidity_2mMin: daily.relative_humidity_2mMin,
							relative_humidity_2mMax: daily.relative_humidity_2mMax,
							wind_speed_10mMin: daily.wind_speed_10mMin,
							wind_speed_10mMax: daily.wind_speed_10mMax,
							wind_speed_180mMin: daily.wind_speed_180mMin,
							wind_speed_180mMax: daily.wind_speed_180mMax,
							cumulativePrecipitation: daily.cumulativePrecipitation,
							...(parcelIds.length > 0 && {
								parcels: {
									connect: parcelIds.map((id) => ({ id })),
								},
							}),
						},
					});

					totalEntriesCreated++;
				}

				tasksProcessed++;
			} catch (error) {
				const errorMessage = `Error processing task ${task.id} (${task.cityName}): ${
					error instanceof Error ? error.message : String(error)
				}`;
				console.error(errorMessage, error);
				errors.push(errorMessage);
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
