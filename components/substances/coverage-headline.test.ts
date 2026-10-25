import { describe, test, expect } from "vitest";
import { getCoverageHeadline } from "./coverage-headline";
import { type SubstanceCoverage } from "../types";
import {
	COPPER_LEAF_AREA_FACTOR,
	FULL_DOSE_G_PER_HA,
} from "@/lib/coverage-helpers";

function sulfurCoverage(
	remainingPercent: number,
	projectedPercent: number[],
): SubstanceCoverage {
	const fullDose = FULL_DOSE_G_PER_HA.Sulfur;
	return {
		substanceName: "Sulfur",
		color: "green",
		washoffK: 0,
		weightedInitialGPerHa: fullDose,
		weightedRemainingGPerHa: (remainingPercent / 100) * fullDose,
		coveragePercent: remainingPercent,
		fullDoseGPerHa: fullDose,
		parcels: [],
		forecast: projectedPercent.map((percent, i) => ({
			date: new Date(2026, 4, 2 + i),
			precipitationMm: 0,
			cumulativeAdditionalRainMm: 0,
			projectedWeightedRemainingGPerHa: (percent / 100) * fullDose,
		})),
	};
}

function copperCoverage(
	mgPerM2: number,
	projectedMgPerM2: number[],
): SubstanceCoverage {
	return {
		substanceName: "Copper",
		color: "blue",
		washoffK: 0,
		weightedInitialGPerHa: mgPerM2 * COPPER_LEAF_AREA_FACTOR,
		weightedRemainingGPerHa: mgPerM2 * COPPER_LEAF_AREA_FACTOR,
		coveragePercent: null,
		fullDoseGPerHa: FULL_DOSE_G_PER_HA.Copper,
		leafSurfaceMgPerM2: mgPerM2,
		parcels: [],
		forecast: projectedMgPerM2.map((mg, i) => ({
			date: new Date(2026, 4, 2 + i),
			precipitationMm: 0,
			cumulativeAdditionalRainMm: 0,
			projectedWeightedRemainingGPerHa: mg * COPPER_LEAF_AREA_FACTOR,
			projectedLeafSurfaceMgPerM2: mg,
		})),
	};
}

describe("getCoverageHeadline", () => {
	test("sulfur: same dose is protected outside, re-treat soon in a critical period", () => {
		const coverage = sulfurCoverage(80, [75, 70, 65]);
		expect(getCoverageHeadline(coverage)?.advice).toBe("protected");
		expect(getCoverageHeadline(coverage, true)?.advice).toBe("retreatSoon");
	});

	test("sulfur: a projection above 75 % stays protected in a critical period", () => {
		expect(
			getCoverageHeadline(sulfurCoverage(95, [90, 85, 80]), true)?.advice,
		).toBe("protected");
	});

	test("sulfur: below the threshold today is unchanged by the stage", () => {
		const coverage = sulfurCoverage(40, [35, 30, 25]);
		expect(getCoverageHeadline(coverage)?.advice).toBe("retreatSoon");
		expect(getCoverageHeadline(coverage, true)?.advice).toBe("retreatSoon");
	});

	test("sulfur: a critical period also applies without a forecast", () => {
		expect(getCoverageHeadline(sulfurCoverage(60, []), true)?.advice).toBe(
			"retreatSoon",
		);
	});

	test("copper: keeps a 25 % margin above 2.5 mg/m² in a critical period", () => {
		const coverage = copperCoverage(3.2, [3.1, 3.0, 2.9]);
		expect(getCoverageHeadline(coverage)?.advice).toBe("protected");
		expect(getCoverageHeadline(coverage, true)?.advice).toBe("retreatSoon");
		expect(
			getCoverageHeadline(copperCoverage(4, [3.8, 3.6, 3.4]), true)?.advice,
		).toBe("protected");
	});

	test("copper: below 2.5 mg/m² is re-treat now either way", () => {
		expect(getCoverageHeadline(copperCoverage(2, [1.9]), true)?.advice).toBe(
			"retreatNow",
		);
	});
});
