import {
	DiseaseSensitivityLevel,
	type Disease,
	type DiseaseStageSensitivity,
	type PhenologicalStage,
} from "@prisma/client";
import { PHENOLOGICAL_STAGES } from "./phenology";

// Levels from lowest to highest risk.
export const SENSITIVITY_LEVELS = [
	DiseaseSensitivityLevel.NONE,
	DiseaseSensitivityLevel.LOW,
	DiseaseSensitivityLevel.MEDIUM,
	DiseaseSensitivityLevel.HIGH,
	DiseaseSensitivityLevel.VERY_HIGH,
] as const;

// From this level a disease counts as active at a stage (replaces the month window).
export const ACTIVE_FROM_LEVEL = DiseaseSensitivityLevel.MEDIUM;
// From this level a stage is a "critical period" for the disease.
export const CRITICAL_FROM_LEVEL = DiseaseSensitivityLevel.HIGH;

// Sensitivity matrix from design-docs/phenological-stage.md, for the diseases in the
// catalogue, keyed by disease name. Ranges in the matrix ("Low–Medium") are rounded
// up, and the level is the higher of bunch and leaf risk where the matrix notes it.
// Only used when a parcel has a current stage: with no stage (never set, or expired
// after STAGE_EXPIRES_AFTER_DAYS) it is ignored and the month windows apply.
export const DISEASE_STAGE_SENSITIVITY_MATRIX = {
	Peronospora: {
		BUD_BREAK: DiseaseSensitivityLevel.NONE,
		LEAVES_UNFOLDING: DiseaseSensitivityLevel.MEDIUM,
		FLOWER_CLUSTERS: DiseaseSensitivityLevel.HIGH,
		FLOWERING: DiseaseSensitivityLevel.VERY_HIGH,
		FRUIT_SET: DiseaseSensitivityLevel.VERY_HIGH,
		BUNCH_CLOSURE: DiseaseSensitivityLevel.MEDIUM,
		VERAISON: DiseaseSensitivityLevel.LOW,
		RIPE: DiseaseSensitivityLevel.LOW,
	},
	Oidium: {
		BUD_BREAK: DiseaseSensitivityLevel.LOW,
		LEAVES_UNFOLDING: DiseaseSensitivityLevel.MEDIUM,
		FLOWER_CLUSTERS: DiseaseSensitivityLevel.HIGH,
		FLOWERING: DiseaseSensitivityLevel.VERY_HIGH,
		FRUIT_SET: DiseaseSensitivityLevel.VERY_HIGH,
		BUNCH_CLOSURE: DiseaseSensitivityLevel.MEDIUM,
		VERAISON: DiseaseSensitivityLevel.LOW,
		RIPE: DiseaseSensitivityLevel.LOW,
	},
} satisfies Record<string, Record<PhenologicalStage, DiseaseSensitivityLevel>>;

// Rows to nest under `disease.create` for a disease of the matrix.
export function getStageSensitivityRows(
	diseaseName: keyof typeof DISEASE_STAGE_SENSITIVITY_MATRIX,
) {
	const levels = DISEASE_STAGE_SENSITIVITY_MATRIX[diseaseName];
	return PHENOLOGICAL_STAGES.map((stage) => ({ stage, level: levels[stage] }));
}

// Negative when a is a lower risk than b, positive when higher, 0 when equal.
export function compareSensitivityLevels(
	a: DiseaseSensitivityLevel,
	b: DiseaseSensitivityLevel,
): number {
	return SENSITIVITY_LEVELS.indexOf(a) - SENSITIVITY_LEVELS.indexOf(b);
}

export function isCriticalLevel(level: DiseaseSensitivityLevel): boolean {
	return compareSensitivityLevels(level, CRITICAL_FROM_LEVEL) >= 0;
}

type StageSensitivity = Pick<
	DiseaseStageSensitivity,
	"diseaseId" | "stage" | "level"
>;

export function getSensitivityLevel(
	sensitivities: StageSensitivity[],
	diseaseId: string,
	stage: PhenologicalStage,
): DiseaseSensitivityLevel | null {
	return (
		sensitivities.find(
			(sensitivity) =>
				sensitivity.diseaseId === diseaseId && sensitivity.stage === stage,
		)?.level ?? null
	);
}

// Whether a disease is active for a parcel: by its level at the parcel's stage, or by
// the month window when the stage is unknown (or expired) or has no matrix row.
export function isDiseaseActive(
	disease: Pick<Disease, "id" | "sensitivityMonthMin" | "sensitivityMonthMax">,
	sensitivities: StageSensitivity[],
	stage: PhenologicalStage | null,
	date: Date,
): boolean {
	const level = stage
		? getSensitivityLevel(sensitivities, disease.id, stage)
		: null;
	if (level) {
		return compareSensitivityLevels(level, ACTIVE_FROM_LEVEL) >= 0;
	}
	const month = date.getMonth() + 1;
	return (
		disease.sensitivityMonthMin !== null &&
		disease.sensitivityMonthMax !== null &&
		disease.sensitivityMonthMin <= month &&
		month <= disease.sensitivityMonthMax
	);
}
