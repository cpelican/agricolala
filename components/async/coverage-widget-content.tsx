import {
	getCachedCompositions,
	getCachedSubstances,
	getCurrentDiseases,
	getTreatmentsWithParcelWeather,
} from "@/lib/data-fetcher";
import { calculateCoverageData } from "@/lib/coverage-helpers";
import { OpenMeteoClient } from "@/lib/open-meteo-client";
import { CoverageWidget } from "@/components/substances/coverage-widget";

interface CoverageWidgetContentProps {
	userId: string;
}

export async function CoverageWidgetContent({
	userId,
}: CoverageWidgetContentProps) {
	// Hide widget entirely outside disease season (e.g. December)
	let data;
	try {
		const activeDiseases = await getCurrentDiseases();
		if (activeDiseases.length === 0) return null;

		const [parcels, compositions, substances] = await Promise.all([
			getTreatmentsWithParcelWeather(userId),
			getCachedCompositions(),
			getCachedSubstances(),
		]);

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
				);
			} catch (err) {
				console.error("[CoverageWidget] forecast fetch failed:", err);
			}
		}

		const substanceColorMap = Object.fromEntries(
			substances.map((s) => [s.name, s.color]),
		);

		data = calculateCoverageData(
			parcels,
			compositions,
			substanceColorMap,
			forecastDays,
		);
	} catch (err) {
		console.error("[CoverageWidget] failed to load coverage data:", err);
		return null;
	}

	if (!data || data.substances.length === 0) return null;

	return <CoverageWidget data={data} />;
}
