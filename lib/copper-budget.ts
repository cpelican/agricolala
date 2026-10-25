import { PhenologicalStage } from "@prisma/client";
import { type SubstanceData } from "@/components/types";
import { GRAMS_PER_KILOGRAM } from "./constants";
import { COPPER_SUBSTANCE_NAME } from "./coverage-helpers";
import { compareStages } from "./phenology";

// Copper budget pacing (P7): the bunches are most at risk from flowering to bunch
// closure, so the cumulated-dose section says how much of the yearly copper limit is
// left for that window, until it ends.
export const COPPER_WINDOW_START = PhenologicalStage.FLOWERING;
export const COPPER_WINDOW_END = PhenologicalStage.BUNCH_CLOSURE;

export type CopperBudgetPacing = {
	// Before flowering, the whole window is still ahead; during it, only its end.
	phase: "beforeWindow" | "inWindow";
	leftKgPerHa: number;
};

// Null for other substances, without a yearly limit, without a stage, or once the
// window is over.
export function getCopperBudgetPacing(
	substance: Pick<
		SubstanceData,
		"name" | "maxDosage" | "totalUsedOfPureActiveSubstancePerHaGrams"
	>,
	stage: PhenologicalStage | null,
): CopperBudgetPacing | null {
	if (substance.name !== COPPER_SUBSTANCE_NAME || substance.maxDosage <= 0) {
		return null;
	}
	if (!stage || compareStages(stage, COPPER_WINDOW_END) > 0) return null;

	const usedKgPerHa =
		substance.totalUsedOfPureActiveSubstancePerHaGrams / GRAMS_PER_KILOGRAM;
	return {
		phase:
			compareStages(stage, COPPER_WINDOW_START) < 0
				? "beforeWindow"
				: "inWindow",
		leftKgPerHa: Math.max(0, substance.maxDosage - usedKgPerHa),
	};
}

// The farm-wide limit is shared by every parcel, so the dashboard paces it for the
// parcel with the most season ahead: the earliest current stage.
export function getEarliestStage(
	stages: PhenologicalStage[],
): PhenologicalStage | null {
	return stages.reduce<PhenologicalStage | null>(
		(earliest, stage) =>
			earliest === null || compareStages(stage, earliest) < 0
				? stage
				: earliest,
		null,
	);
}
