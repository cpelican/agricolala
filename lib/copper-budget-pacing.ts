import { type PhenologicalStage } from "@prisma/client";
import { GRAMS_PER_KILOGRAM } from "./constants";
import { COPPER_SUBSTANCE_NAME, FULL_DOSE_G_PER_HA } from "./coverage-helpers";
import { compareStages } from "./phenology";

// Copper sprays still ahead in the flowering → bunch-closure window, from the start of
// each stage. Bunches are most at risk from bloom to 3–4 weeks after it (see the
// design doc's sensitivity matrix); copper is avoided during the few days of flowering
// (P10), so the window holds about 3 weeks of small berries and 1 of bunch closing, at
// one spray a week (the 7-day label interval of the seeded copper products).
export const COPPER_WINDOW_SPRAYS_BY_STAGE = {
	BUD_BREAK: 4,
	LEAVES_UNFOLDING: 4,
	FLOWER_CLUSTERS: 4,
	FLOWERING: 4,
	FRUIT_SET: 3,
	BUNCH_CLOSURE: 1,
	VERAISON: 0,
	RIPE: 0,
} satisfies Record<PhenologicalStage, number>;

// Each spray of the window is counted at the full-protection dose of the coverage
// readout (100 g/ha), so the reserve is a minimum: heavier sprays need more.
export const COPPER_WINDOW_SPRAY_DOSE_G_PER_HA =
	FULL_DOSE_G_PER_HA[COPPER_SUBSTANCE_NAME];

// How much of the yearly copper limit is left for the window, at `stage`. Null for
// other substances, without a stage, without a limit, or once bunch closure is past.
export function getCopperBudgetPacing({
	substanceName,
	usedGPerHa,
	maxDosageKgPerHa,
	stage,
}: {
	substanceName: string;
	usedGPerHa: number;
	maxDosageKgPerHa: number;
	stage: PhenologicalStage | null;
}) {
	if (substanceName !== COPPER_SUBSTANCE_NAME || !stage) return null;
	if (maxDosageKgPerHa <= 0) return null;
	const spraysAhead = COPPER_WINDOW_SPRAYS_BY_STAGE[stage];
	if (spraysAhead === 0) return null;

	const leftKgPerHa = Math.max(
		0,
		maxDosageKgPerHa - usedGPerHa / GRAMS_PER_KILOGRAM,
	);
	const reserveKgPerHa =
		(spraysAhead * COPPER_WINDOW_SPRAY_DOSE_G_PER_HA) / GRAMS_PER_KILOGRAM;
	return {
		leftKgPerHa,
		reserveKgPerHa,
		spraysAhead,
		isInWindow: compareStages(stage, "FLOWERING") >= 0,
		isShort: leftKgPerHa < reserveKgPerHa,
	};
}

// The farm-wide copper total spans every parcel, so pacing follows the parcel with
// the most of the window still ahead: the earliest current stage.
export function getEarliestStage(
	stages: { stage: PhenologicalStage }[],
): PhenologicalStage | null {
	return stages.reduce<PhenologicalStage | null>(
		(earliest, { stage }) =>
			earliest === null || compareStages(stage, earliest) < 0
				? stage
				: earliest,
		null,
	);
}
