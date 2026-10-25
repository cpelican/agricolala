import { describe, test, expect, beforeEach } from "vitest";
import { PhenologicalStage, type PrismaClient } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import {
	getEstimatedStage,
	getStageEstimate,
	getStageToConfirm,
	getThermalSum,
} from "./phenology-estimate";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const day = (month: number, date: number) =>
	new Date(Date.UTC(2026, month - 1, date));
const SEASON_START = day(3, 1);

function temperatures(from: Date, count: number, min: number, max: number) {
	return Array.from({ length: count }, (_, i) => ({
		dateTime: new Date(from.getTime() + i * MS_PER_DAY),
		temperature2mMin: min,
		temperature2mMax: max,
	}));
}

describe("getThermalSum", () => {
	test("sums the daily means of [from, to)", () => {
		expect(
			getThermalSum(temperatures(day(3, 1), 3, 6, 14), day(3, 1), day(3, 4)),
		).toBe(30);
	});

	test("counts negative means as 0 (base 0 °C)", () => {
		expect(
			getThermalSum(
				[
					...temperatures(day(3, 1), 1, -8, -2),
					...temperatures(day(3, 2), 1, 4, 8),
				],
				day(3, 1),
				day(3, 3),
			),
		).toBe(6);
	});

	test("null when a day before the last stored one is missing or has no temperature", () => {
		const days = temperatures(day(3, 1), 3, 6, 14);
		expect(getThermalSum([days[0], days[2]], day(3, 1), day(3, 4))).toBe(null);
		expect(
			getThermalSum(
				[days[0], { ...days[1], temperature2mMax: null }, days[2]],
				day(3, 1),
				day(3, 4),
			),
		).toBe(null);
	});

	test("sums up to the last stored day while the weekly cron hasn't run yet", () => {
		// Stored 1–3 March; 4–11 March (8 days) not yet.
		expect(
			getThermalSum(temperatures(day(3, 1), 3, 6, 14), day(3, 1), day(3, 12)),
		).toBe(30);
	});

	test("null once more than 8 days at the end are missing", () => {
		expect(
			getThermalSum(temperatures(day(3, 1), 3, 6, 14), day(3, 1), day(3, 13)),
		).toBe(null);
	});

	test("counts a day stored twice once", () => {
		const days = temperatures(day(3, 1), 2, 6, 14);
		expect(getThermalSum([...days, days[0]], day(3, 1), day(3, 3))).toBe(20);
	});
});

describe("getEstimatedStage", () => {
	test("flowering from 1282 °C·day, veraison from 2528", () => {
		expect(getEstimatedStage(1281)).toBe(null);
		expect(getEstimatedStage(1282)).toBe(PhenologicalStage.FLOWERING);
		expect(getEstimatedStage(2527)).toBe(PhenologicalStage.FLOWERING);
		expect(getEstimatedStage(2528)).toBe(PhenologicalStage.VERAISON);
	});
});

describe("getStageToConfirm", () => {
	const flowering = PhenologicalStage.FLOWERING;

	test("asks when this season's latest stage is before the estimate", () => {
		expect(
			getStageToConfirm(
				flowering,
				{ stage: PhenologicalStage.FLOWER_CLUSTERS, observedAt: day(5, 1) },
				SEASON_START,
			),
		).toBe(flowering);
	});

	test("not once the stage, or a later one, is recorded this season", () => {
		expect(
			getStageToConfirm(
				flowering,
				{ stage: flowering, observedAt: day(5, 1) },
				SEASON_START,
			),
		).toBe(null);
		expect(
			getStageToConfirm(
				flowering,
				{ stage: PhenologicalStage.FRUIT_SET, observedAt: day(5, 1) },
				SEASON_START,
			),
		).toBe(null);
	});

	test("asks when the latest stage is from a previous season", () => {
		expect(
			getStageToConfirm(
				flowering,
				{ stage: PhenologicalStage.RIPE, observedAt: new Date(2025, 8, 1) },
				SEASON_START,
			),
		).toBe(flowering);
	});

	test("never for a parcel that has no observation, or without an estimate", () => {
		expect(getStageToConfirm(flowering, null, SEASON_START)).toBe(null);
		expect(
			getStageToConfirm(
				null,
				{ stage: PhenologicalStage.BUD_BREAK, observedAt: day(4, 1) },
				SEASON_START,
			),
		).toBe(null);
	});
});

describe("[Integration] getStageEstimate", () => {
	let testPrisma: PrismaClient;
	let testData: Awaited<ReturnType<typeof seedTestData>>;
	const today = new Date(Date.UTC(2026, 5, 1, 12));
	// 1 March to 31 May.
	const dayCount = 92;

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
		testData = await seedTestData();
	});

	async function seedWeather(dailyMean: number, count = dayCount) {
		const { testParcel } = testData;
		const task = await testPrisma.weatherHistoryTask.create({
			data: { cityName: "Test", latitude: 44, longitude: 9 },
		});
		for (const weather of temperatures(
			SEASON_START,
			count,
			dailyMean,
			dailyMean,
		)) {
			await testPrisma.weatherHistory.create({
				data: {
					...weather,
					cityName: task.cityName,
					weatherHistoryTaskId: task.id,
					parcels: { connect: [{ id: testParcel.id }] },
				},
			});
		}
	}

	async function observe(stage: PhenologicalStage, observedAt: Date) {
		await testPrisma.phenologyObservation.create({
			data: { parcelId: testData.testParcel.id, stage, observedAt },
		});
	}

	test("flowering once the sum since 1 March reaches its threshold", async () => {
		// 92 days × 15 °C = 1380 °C·day.
		await seedWeather(15);
		await observe(PhenologicalStage.FLOWER_CLUSTERS, day(5, 10));

		expect(
			await getStageEstimate(testPrisma, testData.testParcel.id, today),
		).toBe(PhenologicalStage.FLOWERING);
	});

	test("still estimated while the last week's weather isn't fetched yet", async () => {
		// Stored up to 24 May: 85 days × 16 °C = 1360 °C·day.
		await seedWeather(16, dayCount - 7);
		await observe(PhenologicalStage.FLOWER_CLUSTERS, day(5, 10));

		expect(
			await getStageEstimate(testPrisma, testData.testParcel.id, today),
		).toBe(PhenologicalStage.FLOWERING);
	});

	test("nothing while a day since 1 March is missing", async () => {
		await seedWeather(15);
		await testPrisma.weatherHistory.deleteMany({
			where: { dateTime: day(4, 15) },
		});
		await observe(PhenologicalStage.FLOWER_CLUSTERS, day(5, 10));

		expect(
			await getStageEstimate(testPrisma, testData.testParcel.id, today),
		).toBe(null);
	});

	test("nothing for a parcel that never had a stage", async () => {
		await seedWeather(15);

		expect(
			await getStageEstimate(testPrisma, testData.testParcel.id, today),
		).toBe(null);
	});
});
