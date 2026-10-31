import { PhenologicalStage } from "@prisma/client";

// Stages in the order the vine goes through them during the season, from winter rest.
export const PHENOLOGICAL_STAGES = [
	PhenologicalStage.DORMANT,
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
export const PHENOLOGY_STAGE_BBCH = {
	DORMANT: { min: 0, max: 3 },
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
// Dormancy lasts from leaf fall to bud break, so a "Dormant" observation holds much
// longer: about 8 months, enough to span a winter marked right after harvest.
export const DORMANT_EXPIRES_AFTER_DAYS = 240;

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

// The season loops: after ripe the vines go dormant again.
export function getNextStage(stage: PhenologicalStage): PhenologicalStage {
	return PHENOLOGICAL_STAGES[
		(getStageIndex(stage) + 1) % PHENOLOGICAL_STAGES.length
	];
}

function daysBetween(from: Date, to: Date): number {
	return (to.getTime() - from.getTime()) / MS_PER_DAY;
}

function getExpiresAfterDays(stage: PhenologicalStage): number {
	return stage === PhenologicalStage.DORMANT
		? DORMANT_EXPIRES_AFTER_DAYS
		: STAGE_EXPIRES_AFTER_DAYS;
}

export function isObservationExpired(
	observation: { stage: PhenologicalStage; observedAt: Date },
	date: Date,
): boolean {
	return (
		daysBetween(observation.observedAt, date) >
		getExpiresAfterDays(observation.stage)
	);
}

// Stage to pre-select in the picker: the last observed stage, or the next one once
// the observation is older than STAGE_HINT_NEXT_AFTER_DAYS (except for dormant vines,
// whose bud break no number of days predicts). Null once it has expired.
export function getSuggestedStage(
	observation: { stage: PhenologicalStage; observedAt: Date } | null,
	date: Date,
): PhenologicalStage | null {
	if (!observation || isObservationExpired(observation, date)) {
		return null;
	}
	if (
		observation.stage !== PhenologicalStage.DORMANT &&
		daysBetween(observation.observedAt, date) > STAGE_HINT_NEXT_AFTER_DAYS
	) {
		return getNextStage(observation.stage);
	}
	return observation.stage;
}

// Oldest observation that can still give a stage at `date` (a dormant one). Queries
// fetch from here, then `isObservationExpired` drops the expired ones.
export function getStageExpiryCutoff(date: Date): Date {
	return new Date(date.getTime() - DORMANT_EXPIRES_AFTER_DAYS * MS_PER_DAY);
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
	if (!latest || isObservationExpired(latest, date)) {
		return null;
	}
	return latest.stage;
}
