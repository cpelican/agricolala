import {
	getCachedCompositions,
	getCachedSubstances,
	getCurrentDiseases,
	getTreatmentsWithParcelWeather,
} from "@/lib/data-fetcher";
import { calculateCoverageData } from "@/lib/coverage-helpers";
import { OpenMeteoClient } from "@/lib/open-meteo-client";
import { type CoverageWidgetData } from "@/components/types";

export async function getCoverageWidgetData(
	userId: string,
): Promise<CoverageWidgetData | null> {
	try {
		const [activeDiseases, parcels, compositions, substances] =
			await Promise.all([
				getCurrentDiseases(),
				getTreatmentsWithParcelWeather(userId),
				getCachedCompositions(),
				getCachedSubstances(),
			]);

		// Hide coverage data entirely outside disease season (e.g. December)
		if (activeDiseases.length === 0) return null;

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

		return data.substances.length > 0 ? data : null;
	} catch (err) {
		console.error("[CoverageWidget] failed to load coverage data:", err);
		return null;
	}
}
