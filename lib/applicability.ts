import { PhenologicalStage } from "@prisma/client";
import { Errors } from "@/lib/constants";
import { OpenMeteoClient } from "./open-meteo-client";
import { isObservationExpired } from "./phenology";
import { getLatestObservation } from "./phenology-observations";
import { prisma } from "./prisma";

const average = (arr: number[]) => {
	return arr.reduce((acc, curr) => acc + curr, 0) / arr.length;
};

export const MAX_WIND_SPEED_FOR_TREATMENT = 15;
// https://terraevita.edagricole.it/featured/come-funziona-resistenza-dilavamento/
export const MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT = 25;

// A day suits spraying when the wind is calm enough to avoid drift and the rain
// stays below the wash-off threshold. Only the 10 m wind counts: sprays are
// applied near the ground, so the 180 m wind says nothing about drift.
export function isTreatmentApplicable({
	windSpeed10m,
	cumulativePrecipitation,
}: {
	windSpeed10m: number;
	cumulativePrecipitation: number;
}): boolean {
	return (
		windSpeed10m < MAX_WIND_SPEED_FOR_TREATMENT &&
		cumulativePrecipitation < MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT
	);
}

export interface DayApplicability {
	date: Date;
	cumulativePrecipitation: number;
	averageWindSpeed: number;
	applicable: boolean;
}

// Used when the parcel has no current stage.
const MIN_MONTH_FOR_TREATMENT = 3;
const MAX_MONTH_FOR_TREATMENT = 10;

// "open": show the next days. "dormant": the parcel's stages are tracked but none
// was recorded yet this season, so the vines have not reached bud break.
// "closed": outside the month window, for parcels without a current stage.
export type TreatmentSeason =
	| { state: "open"; stage: PhenologicalStage | null }
	| { state: "dormant" }
	| { state: "closed" };

// Treatment window from bud break (design doc P8). A current stage opens it in
// any month. Without one, the month window applies, except for a parcel whose
// latest observation is from a previous season: it is still dormant.
export function getTreatmentSeason(
	latestObservation: { stage: PhenologicalStage; observedAt: Date } | null,
	now: Date,
): TreatmentSeason {
	if (
		latestObservation &&
		!isObservationExpired(latestObservation.observedAt, now)
	) {
		return { state: "open", stage: latestObservation.stage };
	}

	const currentMonth = now.getMonth() + 1;
	if (
		currentMonth < MIN_MONTH_FOR_TREATMENT ||
		currentMonth > MAX_MONTH_FOR_TREATMENT
	) {
		return { state: "closed" };
	}

	if (
		latestObservation &&
		latestObservation.observedAt.getFullYear() < now.getFullYear()
	) {
		return { state: "dormant" };
	}

	return { state: "open", stage: null };
}

export type TreatmentApplicability =
	| { state: "dormant" }
	| { state: "closed" }
	| { state: "open"; flowering: boolean; days: DayApplicability[] };

export const getNext3DaysTreatmentApplicability = async (
	parcelId: string,
): Promise<TreatmentApplicability> => {
	const now = new Date();
	const [parcel, latestObservation] = await Promise.all([
		prisma.parcel.findUnique({
			where: { id: parcelId },
			select: { latitude: true, longitude: true },
		}),
		getLatestObservation(prisma, parcelId, now),
	]);
	if (!parcel?.latitude || !parcel?.longitude) {
		throw new Error(Errors.RESOURCE_NOT_FOUND);
	}

	const season = getTreatmentSeason(latestObservation, now);
	if (season.state !== "open") {
		return season;
	}

	const next3Days = await OpenMeteoClient.getForecastWeatherData(
		parcel.latitude,
		parcel.longitude,
		{ allowPlaywrightMock: true },
	);

	const days = next3Days.map((day) => {
		const avgWind10m = average([
			day.wind_speed_10mMax ?? 0,
			day.wind_speed_10mMin ?? 0,
		]);
		const avgWind180m = average([
			day.wind_speed_180mMax ?? 0,
			day.wind_speed_180mMin ?? 0,
		]);
		const cumulativePrecipitation = day.cumulativePrecipitation ?? 0;
		const avgWind = average([avgWind10m, avgWind180m]);
		const applicable = isTreatmentApplicable({
			windSpeed10m: avgWind10m,
			cumulativePrecipitation,
		});

		return {
			date: day.date,
			cumulativePrecipitation,
			averageWindSpeed: avgWind,
			applicable,
		};
	});

	return {
		state: "open",
		// At flowering the widget recalls the evening-only rule for the bees (P10)
		flowering: season.stage === PhenologicalStage.FLOWERING,
		days,
	};
};
