import { PhenologicalStage } from "@prisma/client";
import { describe, test, expect } from "vitest";
import {
	PHENOLOGICAL_STAGES,
	PHENOLOGY_STAGE_BBCH,
	STAGE_EXPIRES_AFTER_DAYS,
	STAGE_HINT_NEXT_AFTER_DAYS,
	compareStages,
	getNextStage,
	getStageAt,
	getStageExpiryCutoff,
	getSuggestedStage,
	isObservationExpired,
} from "./phenology";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const NOW = new Date(2026, 5, 1, 12);

function daysAgo(days: number) {
	return new Date(NOW.getTime() - days * MS_PER_DAY);
}

describe("stage order and BBCH mapping", () => {
	test("lists every enum value once", () => {
		expect([...PHENOLOGICAL_STAGES].sort()).toEqual(
			Object.values(PhenologicalStage).sort(),
		);
	});

	test("BBCH ranges increase with the stage order", () => {
		const ranges = PHENOLOGICAL_STAGES.map((s) => PHENOLOGY_STAGE_BBCH[s]);
		ranges.forEach((range, i) => {
			expect(range.min).toBeLessThanOrEqual(range.max);
			if (i > 0) {
				expect(range.min).toBeGreaterThan(ranges[i - 1].max);
			}
		});
	});

	test("compareStages follows the season", () => {
		expect(
			compareStages(PhenologicalStage.BUD_BREAK, PhenologicalStage.FLOWERING),
		).toBeLessThan(0);
		expect(
			compareStages(PhenologicalStage.VERAISON, PhenologicalStage.FRUIT_SET),
		).toBeGreaterThan(0);
		expect(
			compareStages(PhenologicalStage.FLOWERING, PhenologicalStage.FLOWERING),
		).toBe(0);
	});

	test("getNextStage returns the following stage, null after ripe", () => {
		expect(getNextStage(PhenologicalStage.FLOWER_CLUSTERS)).toBe(
			PhenologicalStage.FLOWERING,
		);
		expect(getNextStage(PhenologicalStage.RIPE)).toBeNull();
	});
});

describe("expiry and suggestions", () => {
	test("an observation expires only after STAGE_EXPIRES_AFTER_DAYS", () => {
		expect(isObservationExpired(daysAgo(STAGE_EXPIRES_AFTER_DAYS), NOW)).toBe(
			false,
		);
		expect(
			isObservationExpired(daysAgo(STAGE_EXPIRES_AFTER_DAYS + 1), NOW),
		).toBe(true);
	});

	test("expiry cutoff is STAGE_EXPIRES_AFTER_DAYS before the date", () => {
		expect(getStageExpiryCutoff(NOW).getTime()).toBe(
			daysAgo(STAGE_EXPIRES_AFTER_DAYS).getTime(),
		);
	});

	test("suggests the last stage while it is recent", () => {
		expect(
			getSuggestedStage(
				{ stage: PhenologicalStage.FLOWERING, observedAt: daysAgo(3) },
				NOW,
			),
		).toBe(PhenologicalStage.FLOWERING);
	});

	test("suggests the next stage once the observation is stale", () => {
		expect(
			getSuggestedStage(
				{
					stage: PhenologicalStage.FLOWERING,
					observedAt: daysAgo(STAGE_HINT_NEXT_AFTER_DAYS + 1),
				},
				NOW,
			),
		).toBe(PhenologicalStage.FRUIT_SET);
	});

	test("keeps ripe when there is no next stage", () => {
		expect(
			getSuggestedStage(
				{
					stage: PhenologicalStage.RIPE,
					observedAt: daysAgo(STAGE_HINT_NEXT_AFTER_DAYS + 1),
				},
				NOW,
			),
		).toBe(PhenologicalStage.RIPE);
	});

	test("suggests nothing when there is no observation or it expired", () => {
		expect(getSuggestedStage(null, NOW)).toBeNull();
		expect(
			getSuggestedStage(
				{
					stage: PhenologicalStage.FLOWERING,
					observedAt: daysAgo(STAGE_EXPIRES_AFTER_DAYS + 1),
				},
				NOW,
			),
		).toBeNull();
	});
});

describe("getStageAt", () => {
	const observations = [
		{ stage: PhenologicalStage.FLOWER_CLUSTERS, observedAt: daysAgo(10) },
		{ stage: PhenologicalStage.FLOWERING, observedAt: daysAgo(2) },
		{ stage: PhenologicalStage.FRUIT_SET, observedAt: daysAgo(-3) },
	];

	test("returns the latest observation on or before the date", () => {
		expect(getStageAt(observations, NOW)).toBe(PhenologicalStage.FLOWERING);
		expect(getStageAt(observations, daysAgo(2))).toBe(
			PhenologicalStage.FLOWERING,
		);
		expect(getStageAt(observations, daysAgo(5))).toBe(
			PhenologicalStage.FLOWER_CLUSTERS,
		);
	});

	test("lets the later entry win when two share the same date", () => {
		expect(
			getStageAt(
				[
					{ stage: PhenologicalStage.FLOWERING, observedAt: daysAgo(1) },
					{ stage: PhenologicalStage.FRUIT_SET, observedAt: daysAgo(1) },
				],
				NOW,
			),
		).toBe(PhenologicalStage.FRUIT_SET);
	});

	test("returns null before the first observation or once it expired", () => {
		expect(getStageAt(observations, daysAgo(11))).toBeNull();
		expect(getStageAt([], NOW)).toBeNull();
		expect(
			getStageAt(
				[
					{
						stage: PhenologicalStage.FLOWERING,
						observedAt: daysAgo(STAGE_EXPIRES_AFTER_DAYS + 1),
					},
				],
				NOW,
			),
		).toBeNull();
	});
});
