import { describe, expect, test } from "vitest";
import { PhenologicalStage } from "@prisma/client";
import {
	MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT,
	MAX_WIND_SPEED_FOR_TREATMENT,
	getTreatmentSeason,
	isTreatmentApplicable,
} from "./applicability";
import { STAGE_EXPIRES_AFTER_DAYS } from "./phenology";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBefore(date: Date, days: number) {
	return new Date(date.getTime() - days * MS_PER_DAY);
}

describe("getTreatmentSeason", () => {
	const MAY = new Date(2026, 4, 15, 12);
	const FEBRUARY = new Date(2026, 1, 20, 12);
	const NOVEMBER = new Date(2026, 10, 10, 12);

	test("opens with the current stage, even before March", () => {
		expect(
			getTreatmentSeason(
				{
					stage: PhenologicalStage.BUD_BREAK,
					observedAt: daysBefore(FEBRUARY, 2),
				},
				FEBRUARY,
			),
		).toEqual({ state: "open", stage: PhenologicalStage.BUD_BREAK });
	});

	test("gives the current stage within the month window", () => {
		expect(
			getTreatmentSeason(
				{ stage: PhenologicalStage.FLOWERING, observedAt: daysBefore(MAY, 1) },
				MAY,
			),
		).toEqual({ state: "open", stage: PhenologicalStage.FLOWERING });
	});

	test("is dormant when the latest observation is from a previous season", () => {
		expect(
			getTreatmentSeason(
				{
					stage: PhenologicalStage.RIPE,
					observedAt: new Date(2025, 8, 20),
				},
				MAY,
			),
		).toEqual({ state: "dormant", recorded: false });
	});

	test("is dormant while a dormant stage marked over the winter holds", () => {
		expect(
			getTreatmentSeason(
				{ stage: PhenologicalStage.DORMANT, observedAt: new Date(2025, 10, 5) },
				new Date(2026, 3, 1, 12),
			),
		).toEqual({ state: "dormant", recorded: true });
	});

	test("is closed, not open, for a dormant stage outside the month window", () => {
		expect(
			getTreatmentSeason(
				{
					stage: PhenologicalStage.DORMANT,
					observedAt: daysBefore(NOVEMBER, 2),
				},
				NOVEMBER,
			),
		).toEqual({ state: "closed" });
	});

	test("falls back to the month window when this season's stage expired", () => {
		expect(
			getTreatmentSeason(
				{
					stage: PhenologicalStage.LEAVES_UNFOLDING,
					observedAt: daysBefore(MAY, STAGE_EXPIRES_AFTER_DAYS + 1),
				},
				MAY,
			),
		).toEqual({ state: "open", stage: null });
	});

	test("falls back to the month window without any observation", () => {
		expect(getTreatmentSeason(null, MAY)).toEqual({
			state: "open",
			stage: null,
		});
		expect(getTreatmentSeason(null, FEBRUARY)).toEqual({ state: "closed" });
		expect(getTreatmentSeason(null, NOVEMBER)).toEqual({ state: "closed" });
	});

	test("is closed, not dormant, outside the month window", () => {
		expect(
			getTreatmentSeason(
				{ stage: PhenologicalStage.RIPE, observedAt: new Date(2025, 8, 20) },
				FEBRUARY,
			),
		).toEqual({ state: "closed" });
	});
});

describe("isTreatmentApplicable", () => {
	test("accepts a calm, dry day", () => {
		expect(
			isTreatmentApplicable({ windSpeed10m: 8, cumulativePrecipitation: 0 }),
		).toBe(true);
	});

	test("refuses a windy day", () => {
		expect(
			isTreatmentApplicable({
				windSpeed10m: MAX_WIND_SPEED_FOR_TREATMENT,
				cumulativePrecipitation: 0,
			}),
		).toBe(false);
	});

	test("refuses a day with heavy rain, even without wind", () => {
		expect(
			isTreatmentApplicable({
				windSpeed10m: 0,
				cumulativePrecipitation: MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT,
			}),
		).toBe(false);
	});

	test("accepts light rain below the wash-off threshold", () => {
		expect(
			isTreatmentApplicable({
				windSpeed10m: 8,
				cumulativePrecipitation: MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT - 1,
			}),
		).toBe(true);
	});
});
