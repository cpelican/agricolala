import {
	getCachedCompositions,
	getCachedDiseaseStageSensitivities,
	getCachedDiseaseWindows,
	getCachedSubstances,
	getStageByParcel,
	getTreatmentsWithParcelWeather,
} from "@/lib/data-fetcher";
import { getActiveDiseaseIds } from "@/lib/disease-stage-sensitivity";
import { calculateCoverageData } from "@/lib/coverage-helpers";
import { OpenMeteoClient } from "@/lib/open-meteo-client";
import { type CoverageResult } from "@/components/types";

export async function getCoverageWidgetData(
	userId: string,
): Promise<CoverageResult> {
	try {
		const [
			parcels,
			compositions,
			substances,
			diseases,
			sensitivities,
			parcelStages,
		] = await Promise.all([
			getTreatmentsWithParcelWeather(userId),
			getCachedCompositions(),
			getCachedSubstances(),
			getCachedDiseaseWindows(),
			getCachedDiseaseStageSensitivities(),
			getStageByParcel(userId),
		]);

		// Hide coverage data entirely when no disease is active on any parcel, by its
		// stage or, without one, by month (e.g. December)
		const activeDiseaseIds = getActiveDiseaseIds(
			diseases,
			sensitivities,
			parcels.map(
				(parcel) =>
					parcelStages.find((stage) => stage.parcelId === parcel.id)?.stage ??
					null,
			),
			new Date(),
		);
		if (activeDiseaseIds.size === 0) {
			return { status: "hidden", reason: "noActiveDisease" };
		}

		// Fetch 3-day forecast from the first parcel that has coordinates
		const representativeParcel = parcels.find(
			(p) => p.latitude !== null && p.longitude !== null,
		);

		let forecastDays: { date: Date; cumulativePrecipitation: number | null }[] =
			[];
		if (representativeParcel) {
			try {
				forecastDays = await OpenMeteoClient.getForecastWeatherData(
					representativeParcel.latitude,
					representativeParcel.longitude,
					{ allowPlaywrightMock: true },
				);
			} catch (err) {
				console.error("[CoverageWidget] forecast fetch failed:", err);
			}
		}

		const substanceColorMap = Object.fromEntries(
			substances.map((s) => [s.name, s.color]),
		);

		const data = calculateCoverageData(
			parcels,
			compositions,
			substanceColorMap,
			forecastDays,
		);

		return data.substances.length > 0
			? { status: "available", data }
			: { status: "hidden", reason: "noCompletedTreatments" };
	} catch (err) {
		console.error("[CoverageWidget] failed to load coverage data:", err);
		return { status: "hidden", reason: "unavailable" };
	}
}
