import { PhenologicalStage } from "@prisma/client";

// Stages in the order the vine goes through them during the season.
export const PHENOLOGICAL_STAGES = [
	PhenologicalStage.BUD_BREAK,
	PhenologicalStage.LEAVES_UNFOLDING,
	PhenologicalStage.FLOWER_CLUSTERS,
	PhenologicalStage.FLOWERING,
	PhenologicalStage.FRUIT_SET,
	PhenologicalStage.BUNCH_CLOSURE,
	PhenologicalStage.VERAISON,
	PhenologicalStage.RIPE,
] as const;

// BBCH range behind each simplified stage (Lorenz et al. 1995, extended BBCH scale).
// Dormancy (BBCH 00–03) is implied when a parcel has no current observation.
export const PHENOLOGY_STAGE_BBCH = {
	BUD_BREAK: { min: 5, max: 9 },
	LEAVES_UNFOLDING: { min: 11, max: 16 },
	FLOWER_CLUSTERS: { min: 53, max: 57 },
	FLOWERING: { min: 60, max: 69 },
	FRUIT_SET: { min: 71, max: 75 },
	BUNCH_CLOSURE: { min: 77, max: 79 },
	VERAISON: { min: 81, max: 85 },
	RIPE: { min: 89, max: 91 },
} satisfies Record<PhenologicalStage, { min: number; max: number }>;

// After this many days the picker suggests the next stage instead of the last one.
export const STAGE_HINT_NEXT_AFTER_DAYS = 14;
// After this many days an observation no longer counts: the parcel has no current
// stage and stage-based calculations fall back to the month windows.
export const STAGE_EXPIRES_AFTER_DAYS = 21;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getStageIndex(stage: PhenologicalStage): number {
	return PHENOLOGICAL_STAGES.indexOf(stage);
}

// Negative when a comes before b in the season, positive when after, 0 when equal.
export function compareStages(
	a: PhenologicalStage,
	b: PhenologicalStage,
): number {
	return getStageIndex(a) - getStageIndex(b);
}

export function getNextStage(
	stage: PhenologicalStage,
): PhenologicalStage | null {
	return PHENOLOGICAL_STAGES.at(getStageIndex(stage) + 1) ?? null;
}

function daysBetween(from: Date, to: Date): number {
	return (to.getTime() - from.getTime()) / MS_PER_DAY;
}

export function isObservationExpired(observedAt: Date, date: Date): boolean {
	return daysBetween(observedAt, date) > STAGE_EXPIRES_AFTER_DAYS;
}

// Stage to pre-select in the picker: the last observed stage, or the next one once
// the observation is older than STAGE_HINT_NEXT_AFTER_DAYS. Null once it has expired.
export function getSuggestedStage(
	observation: { stage: PhenologicalStage; observedAt: Date } | null,
	date: Date,
): PhenologicalStage | null {
	if (!observation || isObservationExpired(observation.observedAt, date)) {
		return null;
	}
	if (daysBetween(observation.observedAt, date) > STAGE_HINT_NEXT_AFTER_DAYS) {
		return getNextStage(observation.stage) ?? observation.stage;
	}
	return observation.stage;
}

export function getStageExpiryCutoff(date: Date): Date {
	return new Date(date.getTime() - STAGE_EXPIRES_AFTER_DAYS * MS_PER_DAY);
}

// Stage of a parcel at `date`: its latest observation on or before that date, unless
// expired. `observations` belong to one parcel, oldest first (later entries win ties).
export function getStageAt(
	observations: { stage: PhenologicalStage; observedAt: Date }[],
	date: Date,
): PhenologicalStage | null {
	const latest = observations.findLast(
		(observation) => observation.observedAt <= date,
	);
	if (!latest || isObservationExpired(latest.observedAt, date)) {
		return null;
	}
	return latest.stage;
}
