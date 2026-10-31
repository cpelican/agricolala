import { PhenologicalStage } from "@prisma/client";
import { Errors } from "@/lib/constants";
import { OpenMeteoClient } from "./open-meteo-client";
import { isObservationExpired } from "./phenology";
import { getLatestParcelObservation, getParcelLocation } from "./data-fetcher";

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

// "open": show the next days. "dormant": the vines have not reached bud break,
// either marked dormant (`recorded`) or tracked with no stage recorded yet this
// season. "closed": outside the month window, for parcels without a current stage.
export type TreatmentSeason =
	| { state: "open"; stage: PhenologicalStage | null }
	| { state: "dormant"; recorded: boolean }
	| { state: "closed" };

// Treatment window from bud break (design doc P8). A current stage opens it in
// any month, except dormant. Without one, the month window applies, except for a
// parcel marked dormant or whose latest observation is from a previous season.
export function getTreatmentSeason(
	latestObservation: { stage: PhenologicalStage; observedAt: Date } | null,
	now: Date,
): TreatmentSeason {
	const current =
		latestObservation && !isObservationExpired(latestObservation, now)
			? latestObservation
			: null;
	if (current && current.stage !== PhenologicalStage.DORMANT) {
		return { state: "open", stage: current.stage };
	}

	const currentMonth = now.getMonth() + 1;
	if (
		currentMonth < MIN_MONTH_FOR_TREATMENT ||
		currentMonth > MAX_MONTH_FOR_TREATMENT
	) {
		return { state: "closed" };
	}

	if (current) {
		return { state: "dormant", recorded: true };
	}
	if (
		latestObservation &&
		latestObservation.observedAt.getFullYear() < now.getFullYear()
	) {
		return { state: "dormant", recorded: false };
	}

	return { state: "open", stage: null };
}

export type TreatmentApplicability =
	| { state: "dormant"; recorded: boolean }
	| { state: "closed" }
	| { state: "open"; flowering: boolean; days: DayApplicability[] };

export const getNext3DaysTreatmentApplicability = async (
	parcelId: string,
): Promise<TreatmentApplicability> => {
	const now = new Date();
	const [parcel, latestObservation] = await Promise.all([
		getParcelLocation(parcelId),
		getLatestParcelObservation(parcelId, now),
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
		const cumulativePrecipitation = day.cumulativePrecipitation ?? 0;
		const applicable = isTreatmentApplicable({
			windSpeed10m: avgWind10m,
			cumulativePrecipitation,
		});

		return {
			date: day.date,
			cumulativePrecipitation,
			// The wind the applicable rule checks, so the card matches its badge
			averageWindSpeed: avgWind10m,
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
