import { describe, test, expect } from "vitest";
import {
	COPPER_WINDOW_SPRAYS_BY_STAGE,
	getCopperBudgetPacing,
	getEarliestStage,
} from "./copper-budget-pacing";
import { PHENOLOGICAL_STAGES } from "./phenology";

const COPPER = {
	substanceName: "Copper",
	maxDosageKgPerHa: 4,
} as const;

describe("getCopperBudgetPacing", () => {
	test("keeps 4 sprays at 100 g/ha before flowering", () => {
		expect(
			getCopperBudgetPacing({
				...COPPER,
				usedGPerHa: 1_500,
				stage: "FLOWER_CLUSTERS",
			}),
		).toEqual({
			leftKgPerHa: 2.5,
			reserveKgPerHa: 0.4,
			spraysAhead: 4,
			isInWindow: false,
			isShort: false,
		});
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
			})?.spraysAhead,
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

	test("never asks for more sprays later in the season", () => {
		const sprays = PHENOLOGICAL_STAGES.map(
			(stage) => COPPER_WINDOW_SPRAYS_BY_STAGE[stage],
		);
		sprays.forEach((count, i) => {
			if (i > 0) expect(count).toBeLessThanOrEqual(sprays[i - 1]);
		});
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

	test("is null without a current stage", () => {
		expect(getEarliestStage([])).toBeNull();
	});
});
