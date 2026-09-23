export type SubstanceData = {
	name: string;
	totalDoseOfProduct: number;
	totalUsedOfPureActiveSubstance: number;
	/** Pure active substance applied per hectare of treated area, in grams (g/ha). */
	totalUsedOfPureActiveSubstancePerHaGrams: number;
	maxDosage: number;
	monthlyData: number[];
	applicationCount: number;
};

export interface ParcelCoverageEntry {
	parcelId: string;
	parcelName: string;
	areaM2: number;
	initialDoseGPerHa: number;
	remainingDoseGPerHa: number;
	rainSinceLastTreatmentMm: number;
	coveragePercent: number | null;
}

export interface CoverageForecastDay {
	date: Date;
	precipitationMm: number;
	cumulativeAdditionalRainMm: number;
	projectedWeightedRemainingGPerHa: number;
}

export interface SubstanceCoverage {
	substanceName: string;
	color: string;
	washoffK: number;
	weightedInitialGPerHa: number;
	weightedRemainingGPerHa: number;
	coveragePercent: number | null;
	fullDoseGPerHa?: number;
	leafSurfaceMgPerM2?: number;
	parcels: ParcelCoverageEntry[];
	forecast: CoverageForecastDay[];
}

export interface CoverageWidgetData {
	substances: SubstanceCoverage[];
	hasWeatherData: boolean;
	hasIncompleteWeatherHistory: boolean;
}
