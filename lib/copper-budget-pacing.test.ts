import { describe, test, expect } from "vitest";
import {
	COPPER_WINDOW_TREATMENTS_BY_STAGE,
	getCopperBudgetPacing,
	getEarliestStage,
	getMedianTreatmentDoseGPerHa,
} from "./copper-budget-pacing";
import { PHENOLOGICAL_STAGES } from "./phenology";

const COPPER = {
	substanceName: "Copper",
	maxDosageKgPerHa: 4,
	// Lighter than a full-protection treatment, so counted at the 100 g/ha floor.
	medianTreatmentDoseGPerHa: 80,
} as const;

describe("getCopperBudgetPacing", () => {
	test("keeps 4 treatments at the 100 g/ha floor before flowering", () => {
		expect(
			getCopperBudgetPacing({
				...COPPER,
				usedGPerHa: 1_500,
				stage: "FLOWER_CLUSTERS",
			}),
		).toEqual({
			leftKgPerHa: 2.5,
			reserveKgPerHa: 0.4,
			treatmentsAhead: 4,
			treatmentDoseGPerHa: 100,
			isOwnDose: false,
			isInWindow: false,
			isShort: false,
		});
	});

	test("counts the treatments at the grower's median dose", () => {
		const pacing = getCopperBudgetPacing({
			...COPPER,
			usedGPerHa: 1_500,
			stage: "FLOWER_CLUSTERS",
			medianTreatmentDoseGPerHa: 300,
		});
		expect(pacing?.reserveKgPerHa).toBeCloseTo(1.2);
		expect(pacing?.isOwnDose).toBe(true);
		expect(pacing?.isShort).toBe(false);
	});

	test("never counts a treatment below 100 g/ha", () => {
		const pacing = getCopperBudgetPacing({
			...COPPER,
			usedGPerHa: 500,
			stage: "FRUIT_SET",
			medianTreatmentDoseGPerHa: 60,
		});
		expect(pacing?.treatmentDoseGPerHa).toBe(100);
		expect(pacing?.isOwnDose).toBe(false);
	});

	test("flags a budget smaller than the reserve", () => {
		const pacing = getCopperBudgetPacing({
			...COPPER,
			usedGPerHa: 3_700,
			stage: "LEAVES_UNFOLDING",
		});
		expect(pacing?.leftKgPerHa).toBeCloseTo(0.3);
		expect(pacing?.isShort).toBe(true);
	});

	test("shrinks the reserve as the window goes by", () => {
		const fruitSet = getCopperBudgetPacing({
			...COPPER,
			usedGPerHa: 0,
			stage: "FRUIT_SET",
		});
		expect(fruitSet?.reserveKgPerHa).toBeCloseTo(0.3);
		expect(fruitSet?.isInWindow).toBe(true);
		expect(
			getCopperBudgetPacing({
				...COPPER,
				usedGPerHa: 0,
				stage: "BUNCH_CLOSURE",
			})?.treatmentsAhead,
		).toBe(1);
	});

	test("never reads a negative budget once the limit is exceeded", () => {
		const pacing = getCopperBudgetPacing({
			...COPPER,
			usedGPerHa: 4_600,
			stage: "FLOWERING",
		});
		expect(pacing?.leftKgPerHa).toBe(0);
		expect(pacing?.isShort).toBe(true);
	});

	test("returns null before any copper treatment", () => {
		expect(
			getCopperBudgetPacing({
				...COPPER,
				usedGPerHa: 0,
				stage: "FLOWER_CLUSTERS",
				medianTreatmentDoseGPerHa: null,
			}),
		).toBeNull();
	});

	test("returns null after bunch closure, without a stage, a limit, or for sulfur", () => {
		const base = { ...COPPER, usedGPerHa: 1_000 };
		expect(getCopperBudgetPacing({ ...base, stage: "VERAISON" })).toBeNull();
		expect(getCopperBudgetPacing({ ...base, stage: null })).toBeNull();
		expect(
			getCopperBudgetPacing({
				...base,
				maxDosageKgPerHa: -1,
				stage: "FLOWERING",
			}),
		).toBeNull();
		expect(
			getCopperBudgetPacing({
				...base,
				substanceName: "Sulfur",
				stage: "FLOWERING",
			}),
		).toBeNull();
	});

	test("never asks for more treatments later in the season", () => {
		const counts = PHENOLOGICAL_STAGES.filter(
			(stage) => stage !== "DORMANT",
		).map((stage) => COPPER_WINDOW_TREATMENTS_BY_STAGE[stage]);
		counts.forEach((count, i) => {
			if (i > 0) expect(count).toBeLessThanOrEqual(counts[i - 1]);
		});
	});
});

function treatment(
	parcel: { width: number; height: number; areaM2?: number | null },
	applications: { dose: number; composition: [string, number][] }[],
	parcelId = "p1",
) {
	return {
		parcelId,
		parcel: { areaM2: null, ...parcel },
		productApplications: applications.map(({ dose, composition }) => ({
			dose,
			product: {
				composition: composition.map(([name, pct]) => ({
					dose: pct,
					substance: { name },
				})),
			},
		})),
	};
}

describe("getMedianTreatmentDoseGPerHa", () => {
	// 1 000 m² = 0.1 ha: 120 g of a 25 % copper product is 30 g, so 300 g/ha.
	const tenth = { width: 50, height: 20 };

	test("takes the middle treatment, per hectare of each parcel", () => {
		expect(
			getMedianTreatmentDoseGPerHa(
				[
					treatment(tenth, [{ dose: 80, composition: [["Copper", 25]] }]),
					treatment(tenth, [{ dose: 120, composition: [["Copper", 25]] }]),
					treatment({ width: 100, height: 100 }, [
						{ dose: 4_000, composition: [["Copper", 25]] },
					]),
				],
				"Copper",
			),
		).toBe(300);
	});

	test("averages the two middle treatments and sums the products of one", () => {
		expect(
			getMedianTreatmentDoseGPerHa(
				[
					treatment(tenth, [
						{ dose: 80, composition: [["Copper", 25]] },
						{
							dose: 100,
							composition: [
								["Copper", 10],
								["Sulfur", 30],
							],
						},
					]),
					treatment(tenth, [{ dose: 160, composition: [["Copper", 25]] }]),
				],
				"Copper",
			),
		).toBe(350);
	});

	test("prefers the measured area and skips treatments without the substance", () => {
		expect(
			getMedianTreatmentDoseGPerHa(
				[
					treatment({ width: 1, height: 1, areaM2: 1_000 }, [
						{ dose: 120, composition: [["Copper", 25]] },
					]),
					treatment(tenth, [{ dose: 500, composition: [["Sulfur", 80]] }]),
				],
				"Copper",
			),
		).toBe(300);
		expect(
			getMedianTreatmentDoseGPerHa(
				[treatment(tenth, [{ dose: 500, composition: [["Sulfur", 80]] }])],
				"Copper",
			),
		).toBeNull();
	});
});

describe("getEarliestStage", () => {
	test("picks the parcel with the most of the season ahead", () => {
		expect(
			getEarliestStage([
				{ stage: "FRUIT_SET" },
				{ stage: "FLOWER_CLUSTERS" },
				{ stage: "FLOWERING" },
			]),
		).toBe("FLOWER_CLUSTERS");
	});

	test("skips dormant parcels unless every parcel is dormant", () => {
		expect(
			getEarliestStage([
				{ stage: "DORMANT" },
				{ stage: "FRUIT_SET" },
				{ stage: "FLOWERING" },
			]),
		).toBe("FLOWERING");
		expect(getEarliestStage([{ stage: "DORMANT" }])).toBe("DORMANT");
	});

	test("does not pace a dormant vineyard", () => {
		expect(
			getCopperBudgetPacing({
				substanceName: "Copper",
				usedGPerHa: 3000,
				maxDosageKgPerHa: 4,
				stage: "DORMANT",
				medianTreatmentDoseGPerHa: 400,
			}),
		).toBeNull();
	});

	test("is null without a current stage", () => {
		expect(getEarliestStage([])).toBeNull();
	});
});
