import {
	PhenologicalStage,
	type Prisma,
	type PrismaClient,
	type WeatherHistory,
} from "@prisma/client";
import { WEATHER_HISTORY_DAYS, getStartOfUtcDay } from "./open-meteo-schema";
import { compareStages } from "./phenology";
import { getLatestObservation } from "./phenology-observations";
import { getMissingDays, getWeatherSeasonStart } from "./weather-history";

type DbClient = PrismaClient | Prisma.TransactionClient;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Stage estimate from temperature (P5 in design-docs/phenological-stage.md): GFV
// model (Parker et al. 2011, 2013), the daily mean temperatures above 0 °C summed
// from 1 March. Only flowering and veraison have thresholds in this model. Parcels
// have no variety, so the thresholds are Sauvignon blanc's, a mid-range variety
// (1282 and 2528 °C·day, Parker et al. 2020, OENO One 54(4)).
export const GFV_THRESHOLDS = [
	{ stage: PhenologicalStage.FLOWERING, thermalSum: 1282 },
	{ stage: PhenologicalStage.VERAISON, thermalSum: 2528 },
] as const;

type DailyTemperature = Pick<
	WeatherHistory,
	"dateTime" | "temperature2mMin" | "temperature2mMax"
>;

// The weather cron runs once a week and fetches the 7 days before it, so the latest
// days are usually not stored yet; one more day allows for a late run.
const MAX_LATEST_DAYS_MISSING = WEATHER_HISTORY_DAYS + 1;

// °C·day over the UTC days [from, to), up to the last stored day. Null when a day
// before it is missing or has no temperature (a gap would lower the sum and make the
// estimate late), or when more than MAX_LATEST_DAYS_MISSING days at the end are.
export function getThermalSum(
	days: DailyTemperature[],
	from: Date,
	to: Date,
): number | null {
	// A parcel linked to two weather tasks has two rows a day: count each day once.
	const meanByDay = new Map<number, number>();
	for (const day of days) {
		const time = day.dateTime.getTime();
		if (
			day.temperature2mMin === null ||
			day.temperature2mMax === null ||
			time < from.getTime() ||
			time >= to.getTime() ||
			meanByDay.has(time)
		) {
			continue;
		}
		meanByDay.set(time, (day.temperature2mMin + day.temperature2mMax) / 2);
	}
	const storedDays = [...meanByDay.keys()].map((time) => new Date(time));
	const missing = getMissingDays(storedDays, from, to);
	const latestDaysStart = to.getTime() - missing.length * MS_PER_DAY;
	if (
		missing.length > MAX_LATEST_DAYS_MISSING ||
		// Missing days are in order: only the latest ones may be missing.
		(missing.length > 0 && missing[0].getTime() !== latestDaysStart)
	) {
		return null;
	}

	let sum = 0;
	for (const mean of meanByDay.values()) sum += Math.max(0, mean);
	return sum;
}

// Latest stage whose threshold the sum has reached, or null before flowering.
export function getEstimatedStage(
	thermalSum: number,
): PhenologicalStage | null {
	return (
		GFV_THRESHOLDS.findLast((threshold) => thermalSum >= threshold.thermalSum)
			?.stage ?? null
	);
}

// Stage to ask the grower to confirm, or null. As for the bud-break hint (P8), only
// parcels that have an observation are asked, and not once this season's latest
// observation is at or past the estimate.
export function getStageToConfirm(
	estimatedStage: PhenologicalStage | null,
	latestObservation: { stage: PhenologicalStage; observedAt: Date } | null,
	seasonStart: Date,
): PhenologicalStage | null {
	if (!estimatedStage || !latestObservation) return null;
	const isThisSeason = latestObservation.observedAt >= seasonStart;
	if (
		isThisSeason &&
		compareStages(latestObservation.stage, estimatedStage) >= 0
	) {
		return null;
	}
	return estimatedStage;
}

// Stage the temperatures say the parcel has probably reached and its grower has not
// recorded yet, from the days since 1 March up to the last one stored (at most about
// a week before today, see getThermalSum). Never used in a
// calculation: only a confirmed observation is.
export async function getStageEstimate(
	db: DbClient,
	parcelId: string,
	date: Date,
): Promise<PhenologicalStage | null> {
	const todayStart = getStartOfUtcDay(date);
	const seasonStart = getWeatherSeasonStart(todayStart);
	if (seasonStart >= todayStart) return null;

	const [latestObservation, days] = await Promise.all([
		getLatestObservation(db, parcelId, date),
		db.weatherHistory.findMany({
			where: {
				parcels: { some: { id: parcelId } },
				dateTime: { gte: seasonStart, lt: todayStart },
			},
			select: {
				dateTime: true,
				temperature2mMin: true,
				temperature2mMax: true,
			},
		}),
	]);
	const thermalSum = getThermalSum(days, seasonStart, todayStart);
	if (thermalSum === null) return null;

	return getStageToConfirm(
		getEstimatedStage(thermalSum),
		latestObservation,
		seasonStart,
	);
}
