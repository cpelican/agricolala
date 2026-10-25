import { type PhenologicalStage } from "@prisma/client";
import { GRAMS_PER_KILOGRAM } from "./constants";
import { COPPER_SUBSTANCE_NAME, FULL_DOSE_G_PER_HA } from "./coverage-helpers";
import { type getDoneTreatmentDoses } from "./data-fetcher";
import { getParcelAreaM2 } from "./parcel-geometry";
import { compareStages } from "./phenology";

const HECTARE_IN_M2 = 10_000;

// Copper treatments still ahead in the flowering → bunch-closure window, from the start of
// each stage. Bunches are most at risk from bloom to 3–4 weeks after it (see the
// design doc's sensitivity matrix); copper is avoided during the few days of flowering
// (P10), so the window holds about 3 weeks of small berries and 1 of bunch closing, at
// one treatment a week (the 7-day label interval of the seeded copper products).
export const COPPER_WINDOW_TREATMENTS_BY_STAGE = {
	BUD_BREAK: 4,
	LEAVES_UNFOLDING: 4,
	FLOWER_CLUSTERS: 4,
	FLOWERING: 4,
	FRUIT_SET: 3,
	BUNCH_CLOSURE: 1,
	VERAISON: 0,
	RIPE: 0,
} satisfies Record<PhenologicalStage, number>;

// Each treatment of the window is counted at the grower's median copper dose per
// treatment this year, never below the coverage readout's full-protection dose
// (100 g/ha): a lighter treatment does not protect, and the floor is also the dose before any copper.
export const MIN_COPPER_TREATMENT_DOSE_G_PER_HA =
	FULL_DOSE_G_PER_HA[COPPER_SUBSTANCE_NAME];

// Median g/ha of `substanceName` that one done treatment put on its parcel, among
// the treatments that applied it. Null when none did.
export function getMedianTreatmentDoseGPerHa(
	treatments: Awaited<ReturnType<typeof getDoneTreatmentDoses>>,
	substanceName: string,
): number | null {
	const doses = treatments.flatMap((treatment) => {
		const areaM2 = getParcelAreaM2(treatment.parcel);
		if (areaM2 <= 0) return [];
		const grams = treatment.productApplications.reduce(
			(sum, application) =>
				sum +
				application.product.composition
					.filter(({ substance }) => substance.name === substanceName)
					.reduce(
						(productSum, composition) =>
							productSum + application.dose * (composition.dose / 100),
						0,
					),
			0,
		);
		return grams > 0 ? [(grams * HECTARE_IN_M2) / areaM2] : [];
	});
	if (doses.length === 0) return null;

	doses.sort((a, b) => a - b);
	const middle = Math.floor(doses.length / 2);
	return doses.length % 2 === 1
		? doses[middle]
		: (doses[middle - 1] + doses[middle]) / 2;
}

// How much of the yearly copper limit is left for the window, at `stage`. Null for
// other substances, without a stage, without a limit, or once bunch closure is past.
export function getCopperBudgetPacing({
	substanceName,
	usedGPerHa,
	maxDosageKgPerHa,
	stage,
	medianTreatmentDoseGPerHa,
}: {
	substanceName: string;
	usedGPerHa: number;
	maxDosageKgPerHa: number;
	stage: PhenologicalStage | null;
	medianTreatmentDoseGPerHa: number | null;
}) {
	if (substanceName !== COPPER_SUBSTANCE_NAME || !stage) return null;
	if (maxDosageKgPerHa <= 0) return null;
	const treatmentsAhead = COPPER_WINDOW_TREATMENTS_BY_STAGE[stage];
	if (treatmentsAhead === 0) return null;

	const isOwnDose =
		medianTreatmentDoseGPerHa !== null &&
		medianTreatmentDoseGPerHa > MIN_COPPER_TREATMENT_DOSE_G_PER_HA;
	const treatmentDoseGPerHa = isOwnDose
		? medianTreatmentDoseGPerHa
		: MIN_COPPER_TREATMENT_DOSE_G_PER_HA;
	const leftKgPerHa = Math.max(
		0,
		maxDosageKgPerHa - usedGPerHa / GRAMS_PER_KILOGRAM,
	);
	const reserveKgPerHa =
		(treatmentsAhead * treatmentDoseGPerHa) / GRAMS_PER_KILOGRAM;
	return {
		leftKgPerHa,
		reserveKgPerHa,
		treatmentsAhead,
		treatmentDoseGPerHa,
		isOwnDose,
		isInWindow: compareStages(stage, "FLOWERING") >= 0,
		isShort: leftKgPerHa < reserveKgPerHa,
	};
}

// What the copper note needs besides the substance totals: the stage the budget is
// paced for and the grower's median copper dose per treatment. UI-only prop shape.
export type CopperPacingInput = {
	stage: PhenologicalStage | null;
	medianTreatmentDoseGPerHa: number | null;
};

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
