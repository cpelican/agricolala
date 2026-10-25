import { describe, test, expect, beforeEach } from "vitest";
import { type PrismaClient } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { type DailyWeatherData } from "./open-meteo-schema";
import {
	adoptLegacyWeatherRows,
	getMissingDays,
	getStoredWeatherDays,
	getWeatherSeasonStart,
	saveWeatherDays,
} from "./weather-history";

const day = (month: number, date: number) =>
	new Date(Date.UTC(2026, month - 1, date));

function weatherDay(date: Date, rainMm: number): DailyWeatherData {
	return {
		date,
		temperature2mMin: 8,
		temperature2mMax: 20,
		temperature80mMin: null,
		temperature80mMax: null,
		cumulativePrecipitation: rainMm,
		relative_humidity_2mMin: null,
		relative_humidity_2mMax: null,
		wind_speed_10mMin: null,
		wind_speed_10mMax: null,
		wind_speed_180mMin: null,
		wind_speed_180mMax: null,
	};
}

describe("getWeatherSeasonStart", () => {
	test("is 1 March of the date's year", () => {
		expect(getWeatherSeasonStart(day(6, 15))).toEqual(day(3, 1));
		expect(getWeatherSeasonStart(day(1, 10))).toEqual(day(3, 1));
	});
});

describe("getMissingDays", () => {
	test("lists the days of [from, to) without a stored row", () => {
		expect(
			getMissingDays([day(3, 1), day(3, 3)], day(3, 1), day(3, 5)),
		).toEqual([day(3, 2), day(3, 4)]);
	});

	test("nothing when the range is empty", () => {
		expect(getMissingDays([], day(3, 5), day(3, 1))).toEqual([]);
	});
});

describe("[Integration] saveWeatherDays", () => {
	let testPrisma: PrismaClient;
	let testData: Awaited<ReturnType<typeof seedTestData>>;

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
		testData = await seedTestData();
	});

	async function createTask(cityName: string, latitude: number) {
		return testPrisma.weatherHistoryTask.create({
			data: { cityName, latitude, longitude: 9 },
		});
	}

	test("keeps one row per location for the same day, each with its parcels", async () => {
		const { testParcel, testUser } = testData;
		const otherParcel = await testPrisma.parcel.create({
			data: {
				name: "Other place",
				userId: testUser.id,
				members: { create: { userId: testUser.id } },
				latitude: 40,
				longitude: 9,
				width: 10,
				height: 10,
				type: "VINEYARD",
			},
		});
		const genoa = await createTask("Genoa", 44);
		const cagliari = await createTask("Cagliari", 39);

		await saveWeatherDays(
			testPrisma,
			genoa,
			[testParcel.id],
			[weatherDay(day(5, 1), 12)],
		);
		await saveWeatherDays(
			testPrisma,
			cagliari,
			[otherParcel.id],
			[weatherDay(day(5, 1), 0)],
		);

		const rows = await testPrisma.weatherHistory.findMany({
			where: { dateTime: day(5, 1) },
			include: { parcels: { select: { id: true } } },
			orderBy: { cityName: "asc" },
		});
		expect(
			rows.map((row) => [
				row.cityName,
				row.cumulativePrecipitation,
				row.parcels.map((parcel) => parcel.id),
			]),
		).toEqual([
			["Cagliari", 0, [otherParcel.id]],
			["Genoa", 12, [testParcel.id]],
		]);
	});

	test("saving a day again updates it instead of adding a row", async () => {
		const { testParcel } = testData;
		const genoa = await createTask("Genoa", 44);

		await saveWeatherDays(
			testPrisma,
			genoa,
			[testParcel.id],
			[weatherDay(day(5, 1), 3)],
		);
		await saveWeatherDays(
			testPrisma,
			genoa,
			[testParcel.id],
			[weatherDay(day(5, 1), 5), weatherDay(day(5, 2), 0)],
		);

		const rows = await testPrisma.weatherHistory.findMany({
			where: { weatherHistoryTaskId: genoa.id },
			orderBy: { dateTime: "asc" },
		});
		expect(rows.map((row) => row.cumulativePrecipitation)).toEqual([5, 0]);
	});

	test("the task at the same coordinates takes over rows without a task", async () => {
		const { testParcel } = testData;
		const genoa = await createTask("Genoa", 44);
		await testPrisma.weatherHistory.create({
			data: {
				cityName: "Genoa",
				latitude: 44,
				longitude: 9,
				dateTime: day(5, 1),
				cumulativePrecipitation: 7,
				parcels: { connect: [{ id: testParcel.id }] },
			},
		});
		await testPrisma.weatherHistory.create({
			data: {
				cityName: "Cagliari",
				latitude: 39,
				longitude: 9,
				dateTime: day(5, 1),
			},
		});

		await adoptLegacyWeatherRows(testPrisma, genoa);
		await saveWeatherDays(
			testPrisma,
			genoa,
			[testParcel.id],
			[weatherDay(day(5, 1), 8)],
		);

		const genoaRows = await testPrisma.weatherHistory.findMany({
			where: { weatherHistoryTaskId: genoa.id },
		});
		expect(genoaRows.map((row) => row.cumulativePrecipitation)).toEqual([8]);
		expect(
			await testPrisma.weatherHistory.count({
				where: { weatherHistoryTaskId: null },
			}),
		).toBe(1);
	});

	test("a day saved without temperatures is not counted as stored", async () => {
		const { testParcel } = testData;
		const genoa = await createTask("Genoa", 44);
		await saveWeatherDays(
			testPrisma,
			genoa,
			[testParcel.id],
			[
				weatherDay(day(5, 1), 0),
				{ ...weatherDay(day(5, 2), 0), temperature2mMin: null },
			],
		);

		expect(
			await getStoredWeatherDays(testPrisma, genoa.id, day(5, 1), day(5, 3)),
		).toEqual([day(5, 1)]);
	});
});
