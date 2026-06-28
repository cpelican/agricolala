import {
	type CoverageForecastDay,
	type CoverageWidgetData,
	type ParcelCoverageEntry,
	type SubstanceCoverage,
} from "@/components/types";
import {
	type getCachedCompositions,
	type getTreatmentsWithParcelWeather,
} from "./data-fetcher";

// k_rain: per-mm washoff coefficient. ln(2)/threshold_mm → 50% loss at threshold.
// https://terraevita.edagricole.it/featured/come-funziona-resistenza-dilavamento/ (copper, 25mm threshold)
// https://eap.mcgill.ca/CPG_5.htm (sulfur, 2.5mm threshold)
const WASHOFF_COEFFICIENTS: Record<string, number> = {
	Copper: Math.LN2 / 25, // 0.028 — 50% loss at 25mm
	Sulfur: Math.LN2 / 2.5, // 0.277 — 50% loss at 2.5mm (sulfur is much more fragile)
};
const DEFAULT_WASHOFF_K = Math.LN2 / 25; // conservative fallback close to copper

// When Product.daysBetweenApplications is null, fall back to 14 days (conservative: faster decay = safer)
export const DEFAULT_DAYS_BETWEEN_APPLICATIONS = 14;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const COPPER_SUBSTANCE_NAME = "Copper";
// LAI (Leaf Area Index) ≈ 4 for vineyards; ×10 converts g/ha to mg/m²
// Source: InfoWine — Bassi dosaggi di rame in viticoltura
// https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/
const COPPER_LEAF_AREA_FACTOR = 4 * 10;
const COPPER_EFFICACY_THRESHOLD_MG_M2 = 2.5;

// Scientific anchors for 100% coverage per substance.
// Copper: 2.5 mg/m² efficacy threshold × LAI=4 × 10 = 100 g/ha active (InfoWine / Cabùs et al.)
// Sulfur: 8 kg/ha wettable product × 80% composition = 6 400 g/ha active (Vitisphere, lower bound)
export const FULL_DOSE_G_PER_HA: Record<string, number> = {
	Copper: 100,
	Sulfur: 6_400,
};

export function getWashoffK(substanceName: string): number {
	return WASHOFF_COEFFICIENTS[substanceName] ?? DEFAULT_WASHOFF_K;
}

// k_time: per-day time decay coefficient derived from product label reapplication interval.
// ln(2)/days ensures exactly 50% remains at the reapplication interval with zero rain.
export function getTimeDecayK(daysBetweenApplications: number | null): number {
	return (
		Math.LN2 / (daysBetweenApplications ?? DEFAULT_DAYS_BETWEEN_APPLICATIONS)
	);
}

// Fraction of deposit remaining after rainMm of rain. Always in [0,1].
export function computeWashoffFactor(rainMm: number, k: number): number {
	if (rainMm <= 0) return 1;
	return Math.exp(-k * rainMm);
}

// Fraction of deposit remaining after daysSinceTreatment days with no rain. Always in [0,1].
export function computeTimeDecayFactor(
	daysSinceTreatment: number,
	k: number,
): number {
	if (daysSinceTreatment <= 0) return 1;
	return Math.exp(-k * daysSinceTreatment);
}

// Total mm of rain recorded after afterDate (strict >).
export function sumRainAfterDate(
	weatherHistories: {
		dateTime: Date;
		cumulativePrecipitation: number | null;
	}[],
	afterDate: Date,
): number {
	return weatherHistories.reduce((sum, wh) => {
		if (new Date(wh.dateTime) > afterDate) {
			return sum + (wh.cumulativePrecipitation ?? 0);
		}
		return sum;
	}, 0);
}

export function daysSince(date: Date): number {
	return (Date.now() - date.getTime()) / MS_PER_DAY;
}

export function calculateCoverageData(
	parcels: Awaited<ReturnType<typeof getTreatmentsWithParcelWeather>>,
	compositions: Awaited<ReturnType<typeof getCachedCompositions>>,
	substanceColorMap: Record<string, string>,
	forecastDays: { date: Date; cumulativePrecipitation: number | null }[],
): CoverageWidgetData {
	type ParcelAccumulator = {
		parcelId: string;
		parcelName: string;
		areaM2: number;
		initialSumGPerHa: number;
		remainingSumGPerHa: number;
		mostRecentTreatmentDate: Date | null;
		rainSinceLastTreatmentMm: number;
	};

	type SubstanceAccumulator = {
		substanceName: string;
		color: string;
		washoffK: number;
		parcelMap: Map<string, ParcelAccumulator>;
	};

	const substanceMap = new Map<string, SubstanceAccumulator>();
	let hasWeatherData = true;
	let hasIncompleteWeatherHistory = false;

	for (const parcel of parcels) {
		const areaM2 = parcel.width * parcel.height;
		if (areaM2 <= 0) continue;

		const weatherHistories = parcel.weatherHistories;
		if (weatherHistories.length === 0 && parcel.treatments.length > 0) {
			hasWeatherData = false;
		}

		const earliestWeatherDate =
			weatherHistories.length > 0
				? new Date(weatherHistories[0].dateTime)
				: null;

		for (const treatment of parcel.treatments) {
			if (!treatment.appliedDate) continue;
			const appliedDate = new Date(treatment.appliedDate);

			if (earliestWeatherDate && appliedDate < earliestWeatherDate) {
				hasIncompleteWeatherHistory = true;
			}

			const rain = sumRainAfterDate(weatherHistories, appliedDate);
			const days = daysSince(appliedDate);

			for (const app of treatment.productApplications) {
				const kTime = getTimeDecayK(app.product.daysBetweenApplications);

				for (const comp of app.product.composition) {
					const substanceInfo =
						compositions[comp.substanceId]?.[app.product.id];
					if (!substanceInfo) continue;

					const substanceNameInner = substanceInfo.substance.name;
					const kRain = getWashoffK(substanceNameInner);

					// g/ha of pure active substance from this treatment on this parcel
					const initial = app.dose * (comp.dose / 100) * (10_000 / areaM2);
					const remaining =
						initial *
						computeWashoffFactor(rain, kRain) *
						computeTimeDecayFactor(days, kTime);

					if (!substanceMap.has(substanceNameInner)) {
						substanceMap.set(substanceNameInner, {
							substanceName: substanceNameInner,
							color:
								substanceColorMap[substanceNameInner] ?? "rgb(182, 182, 182)",
							washoffK: kRain,
							parcelMap: new Map(),
						});
					}

					const substanceEntry = substanceMap.get(substanceNameInner)!;
					if (!substanceEntry.parcelMap.has(parcel.id)) {
						substanceEntry.parcelMap.set(parcel.id, {
							parcelId: parcel.id,
							parcelName: parcel.name,
							areaM2,
							initialSumGPerHa: 0,
							remainingSumGPerHa: 0,
							mostRecentTreatmentDate: null,
							rainSinceLastTreatmentMm: 0,
						});
					}

					const parcelEntry = substanceEntry.parcelMap.get(parcel.id)!;
					parcelEntry.initialSumGPerHa += initial;
					parcelEntry.remainingSumGPerHa += remaining;

					if (
						!parcelEntry.mostRecentTreatmentDate ||
						appliedDate > parcelEntry.mostRecentTreatmentDate
					) {
						parcelEntry.mostRecentTreatmentDate = appliedDate;
						parcelEntry.rainSinceLastTreatmentMm = rain;
					}
				}
			}
		}
	}

	// Cumulative forecast rain per day
	const cumulativeForecastRain: number[] = [];
	let cumRain = 0;
	for (const day of forecastDays) {
		cumRain += day.cumulativePrecipitation ?? 0;
		cumulativeForecastRain.push(cumRain);
	}

	// Conservative k_time for forecast projection (fallback default)
	const forecastKTime = getTimeDecayK(null);

	const substances: SubstanceCoverage[] = [];

	for (const substanceEntry of substanceMap.values()) {
		const parcelEntries = Array.from(substanceEntry.parcelMap.values());

		const totalAreaM2 = parcelEntries.reduce((sum, p) => sum + p.areaM2, 0);
		if (totalAreaM2 <= 0) continue;

		const weightedInitialGPerHa =
			parcelEntries.reduce((sum, p) => sum + p.initialSumGPerHa * p.areaM2, 0) /
			totalAreaM2;

		const weightedRemainingGPerHa =
			parcelEntries.reduce(
				(sum, p) => sum + p.remainingSumGPerHa * p.areaM2,
				0,
			) / totalAreaM2;

		const substanceName = substanceEntry.substanceName;
		const fullDoseGPerHa = FULL_DOSE_G_PER_HA[substanceName];
		const coveragePercent =
			fullDoseGPerHa != null
				? Math.min(100, (weightedRemainingGPerHa / fullDoseGPerHa) * 100)
				: null;

		const forecast: CoverageForecastDay[] = forecastDays.map((day, i) => {
			const deltaRain = cumulativeForecastRain[i];
			const deltaDays = i;
			const projected =
				weightedRemainingGPerHa *
				computeWashoffFactor(deltaRain, substanceEntry.washoffK) *
				computeTimeDecayFactor(deltaDays, forecastKTime);
			return {
				date: day.date,
				precipitationMm: day.cumulativePrecipitation ?? 0,
				cumulativeAdditionalRainMm: deltaRain,
				projectedWeightedRemainingGPerHa: projected,
			};
		});

		const leafSurfaceMgPerM2 =
			substanceName === COPPER_SUBSTANCE_NAME
				? weightedRemainingGPerHa / COPPER_LEAF_AREA_FACTOR
				: undefined;

		const parcelCoverageEntries: ParcelCoverageEntry[] = parcelEntries.map(
			(p) => ({
				parcelId: p.parcelId,
				parcelName: p.parcelName,
				areaM2: p.areaM2,
				initialDoseGPerHa: p.initialSumGPerHa,
				remainingDoseGPerHa: p.remainingSumGPerHa,
				rainSinceLastTreatmentMm: p.rainSinceLastTreatmentMm,
				coveragePercent:
					fullDoseGPerHa != null
						? Math.min(100, (p.remainingSumGPerHa / fullDoseGPerHa) * 100)
						: null,
			}),
		);

		substances.push({
			substanceName,
			color: substanceEntry.color,
			washoffK: substanceEntry.washoffK,
			weightedInitialGPerHa,
			weightedRemainingGPerHa,
			coveragePercent,
			fullDoseGPerHa,
			leafSurfaceMgPerM2,
			parcels: parcelCoverageEntries,
			forecast,
		});
	}

	return { substances, hasWeatherData, hasIncompleteWeatherHistory };
}

export { COPPER_EFFICACY_THRESHOLD_MG_M2 };
