import {
	type Prisma,
	type PrismaClient,
	type WeatherHistoryTask,
} from "@prisma/client";
import { type DailyWeatherData } from "./open-meteo-schema";

type DbClient = PrismaClient | Prisma.TransactionClient;
type Task = Pick<
	WeatherHistoryTask,
	"id" | "cityName" | "latitude" | "longitude"
>;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Upserts run in batches so a long backfill doesn't exhaust the connection pool.
const UPSERT_BATCH_SIZE = 20;

// History is kept from 1 March, where the thermal sum of the stage estimate starts
// (GFV model, P5 in design-docs/phenological-stage.md). Days are UTC, as stored.
export function getWeatherSeasonStart(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), 2, 1));
}

// UTC days in [from, to) without a stored row.
export function getMissingDays(stored: Date[], from: Date, to: Date): Date[] {
	const storedDays = new Set(stored.map((date) => date.getTime()));
	const missing: Date[] = [];
	for (let day = from.getTime(); day < to.getTime(); day += MS_PER_DAY) {
		if (!storedDays.has(day)) missing.push(new Date(day));
	}
	return missing;
}

// Rows written before history was kept per location have no task. Each holds the
// weather of the last task that wrote that day (and its parcels), so the task at the
// same coordinates takes them over instead of adding a second row for the day.
export async function adoptLegacyWeatherRows(db: DbClient, task: Task) {
	return db.weatherHistory.updateMany({
		where: {
			weatherHistoryTaskId: null,
			latitude: task.latitude,
			longitude: task.longitude,
		},
		data: { weatherHistoryTaskId: task.id },
	});
}

export async function getStoredWeatherDays(
	db: DbClient,
	taskId: string,
	from: Date,
	to: Date,
): Promise<Date[]> {
	const rows = await db.weatherHistory.findMany({
		where: { weatherHistoryTaskId: taskId, dateTime: { gte: from, lt: to } },
		select: { dateTime: true },
	});
	return rows.map((row) => row.dateTime);
}

export async function saveWeatherDays(
	db: DbClient,
	task: Task,
	parcelIds: string[],
	days: DailyWeatherData[],
) {
	const parcels =
		parcelIds.length > 0
			? { connect: parcelIds.map((id) => ({ id })) }
			: undefined;

	for (let i = 0; i < days.length; i += UPSERT_BATCH_SIZE) {
		await Promise.all(
			days.slice(i, i + UPSERT_BATCH_SIZE).map(({ date, ...weather }) => {
				const fields = {
					cityName: task.cityName,
					latitude: task.latitude,
					longitude: task.longitude,
					...weather,
				};
				return db.weatherHistory.upsert({
					where: {
						weatherHistoryTaskId_dateTime: {
							weatherHistoryTaskId: task.id,
							dateTime: date,
						},
					},
					update: { ...fields, parcels },
					create: {
						...fields,
						dateTime: date,
						weatherHistoryTaskId: task.id,
						parcels,
					},
				});
			}),
		);
	}
}
