import { PhenologicalStage } from "@prisma/client";
import { describe, test, expect } from "vitest";
import { getCopperBudgetPacing, getEarliestStage } from "./copper-budget";

const copper = {
	name: "Copper",
	maxDosage: 4,
	totalUsedOfPureActiveSubstancePerHaGrams: 1_500,
};

describe("getCopperBudgetPacing", () => {
	test("before flowering, the whole window is ahead", () => {
		expect(
			getCopperBudgetPacing(copper, PhenologicalStage.FLOWER_CLUSTERS),
		).toEqual({ phase: "beforeWindow", leftKgPerHa: 2.5 });
	});

	test("from flowering to bunch closure, the window is under way", () => {
		expect(getCopperBudgetPacing(copper, PhenologicalStage.FLOWERING)).toEqual({
			phase: "inWindow",
			leftKgPerHa: 2.5,
		});
		expect(
			getCopperBudgetPacing(copper, PhenologicalStage.BUNCH_CLOSURE)?.phase,
		).toBe("inWindow");
	});

	test("hidden once the window is over or without a stage", () => {
		expect(getCopperBudgetPacing(copper, PhenologicalStage.VERAISON)).toBe(
			null,
		);
		expect(getCopperBudgetPacing(copper, null)).toBe(null);
	});

	test("never negative once the limit is exceeded", () => {
		expect(
			getCopperBudgetPacing(
				{ ...copper, totalUsedOfPureActiveSubstancePerHaGrams: 5_000 },
				PhenologicalStage.LEAVES_UNFOLDING,
			)?.leftKgPerHa,
		).toBe(0);
	});

	test("only for copper with a yearly limit", () => {
		expect(
			getCopperBudgetPacing(
				{ ...copper, name: "Sulfur" },
				PhenologicalStage.FLOWERING,
			),
		).toBe(null);
		expect(
			getCopperBudgetPacing(
				{ ...copper, maxDosage: 0 },
				PhenologicalStage.FLOWERING,
			),
		).toBe(null);
	});
});

describe("getEarliestStage", () => {
	test("returns the stage that comes first in the season", () => {
		expect(
			getEarliestStage([
				PhenologicalStage.FRUIT_SET,
				PhenologicalStage.LEAVES_UNFOLDING,
				PhenologicalStage.FLOWERING,
			]),
		).toBe(PhenologicalStage.LEAVES_UNFOLDING);
	});

	test("null without stages", () => {
		expect(getEarliestStage([])).toBe(null);
	});
});
