import { describe, test, expect, beforeEach } from "vitest";
import { type PrismaClient, TreatmentStatus } from "@prisma/client";
import {
	cleanDatabase,
	OIDIUM_SENSITIVITY_MONTH_MAX,
	PERONOSPORA_SENSITIVITY_MONTH_MAX,
	PERONOSPORA_SENSITIVITY_MONTH_MIN,
	seedTestData,
} from "../../../../test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { getCurrentDiseases } from "@/lib/data-fetcher";

// HTTP tests hit Next on :3001 (separate process). Use x-cron-as-of (CRON_ALLOW_AS_OF)
// so the server evaluates seed sensitivity months on a fixed date, not the wall clock.

/** June — both seed diseases active (Peronospora 3–7, Oidium 4–8). */
const CRON_AS_OF_IN_SEASON = new Date(2024, 5, 15, 12, 0, 0);
/** January — neither disease active; interval alone must not create a TODO. */
const CRON_AS_OF_OUT_OF_SEASON = new Date(2024, 0, 15, 12, 0, 0);

/** Local midnight N calendar days before `from` (stable vs cron Math.floor day count). */
function localMidnightDaysAgo(from: Date, days: number): Date {
	return new Date(from.getFullYear(), from.getMonth(), from.getDate() - days);
}

function expectedSuggestedDateRange(
	lastTreatmentDate: Date,
	daysBetweenApplications: number,
): { dateMin: Date; dateMax: Date } {
	const dateMin = new Date(lastTreatmentDate);
	dateMin.setDate(dateMin.getDate() + daysBetweenApplications);
	dateMin.setHours(0, 0, 0, 0);

	const dateMax = new Date(dateMin);
	dateMax.setDate(dateMax.getDate() + daysBetweenApplications);
	dateMax.setHours(0, 0, 0, 0);

	return { dateMin, dateMax };
}

async function fetchSuggestTreatments(asOf: Date) {
	return fetch("http://localhost:3001/api/cron/suggest-treatments", {
		headers: {
			Authorization: `Bearer ${process.env.CRON_SECRET}`,
			"x-cron-as-of": asOf.toISOString(),
		},
	});
}

describe("[Integration] Suggest Treatments", () => {
	let testPrisma: PrismaClient;
	let testData: Awaited<ReturnType<typeof seedTestData>>;

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
		testData = await seedTestData();
	});
	// This is because otherwise the logic becomes too complicated:
	// we would need to look for all previous user treatments and for now we dont want this
	test("should not create a TODO treatment if one of the product used in last treatment is considered still active (daysBetweenApplications not reached)", async () => {
		const { pastTreatment } = testData;
		const lastTreatmentDate = localMidnightDaysAgo(CRON_AS_OF_IN_SEASON, 3);

		await testPrisma.treatment.update({
			where: { id: pastTreatment.id },
			data: {
				appliedDate: lastTreatmentDate,
				diseaseIds: [testData.peronospora.id, testData.oidium.id],
			},
		});

		const previousTreatmentsCount = await testPrisma.treatment.count();

		const response = await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);
		const data = await response.json();

		expect(response.status).toBe(200);

		expect(data).toBeDefined();
		expect(data.success).toBe(true);
		expect(data.message).toBe(`Created 0 suggested treatments`);

		expect(await testPrisma.treatment.count()).toEqual(previousTreatmentsCount);
	});

	test("should create a TODO treatment when all products used in last treatment are no longer considered active (daysBetweenApplications reached)", async () => {
		const { pastTreatment, COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS } =
			testData;
		const lastTreatmentDate = localMidnightDaysAgo(
			CRON_AS_OF_IN_SEASON,
			COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS + 2,
		);

		await testPrisma.treatment.update({
			where: { id: pastTreatment.id },
			data: {
				appliedDate: lastTreatmentDate,
				diseaseIds: [testData.peronospora.id, testData.oidium.id],
			},
		});

		const previousTreatmentsCount = await testPrisma.treatment.count();

		const response = await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);
		const data = await response.json();

		expect(response.status).toBe(200);

		expect(data).toBeDefined();
		expect(data.success).toBe(true);
		expect(data.message).toBe(`Created 1 suggested treatments`);
		expect(await testPrisma.treatment.count()).toEqual(
			previousTreatmentsCount + 1,
		);
		const createdTreatments = await testPrisma.treatment.findMany({
			where: {
				status: TreatmentStatus.TODO,
			},
		});
		expect(createdTreatments.length).toBe(1);
		const createdTreatment = createdTreatments[0];

		const { dateMin: expectedDateMin, dateMax: expectedDateMax } =
			expectedSuggestedDateRange(
				lastTreatmentDate,
				COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS,
			);

		expect(createdTreatment.dateMin?.toISOString().slice(0, 10)).toBe(
			expectedDateMin.toISOString().slice(0, 10),
		);
		expect(createdTreatment.dateMax?.toISOString().slice(0, 10)).toBe(
			expectedDateMax.toISOString().slice(0, 10),
		);
	});

	test("should not create a TODO treatment when no disease is in sensitivity season (asOf out of season)", async () => {
		const { pastTreatment, COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS } =
			testData;
		const lastTreatmentDate = localMidnightDaysAgo(
			CRON_AS_OF_OUT_OF_SEASON,
			COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS + 2,
		);

		await testPrisma.treatment.update({
			where: { id: pastTreatment.id },
			data: {
				appliedDate: lastTreatmentDate,
				diseaseIds: [testData.peronospora.id, testData.oidium.id],
			},
		});

		const previousTreatmentsCount = await testPrisma.treatment.count();

		const response = await fetchSuggestTreatments(CRON_AS_OF_OUT_OF_SEASON);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toBe(`Created 0 suggested treatments`);
		expect(await testPrisma.treatment.count()).toEqual(previousTreatmentsCount);
	});

	test.each([
		[
			new Date(2024, PERONOSPORA_SENSITIVITY_MONTH_MIN - 1, 24, 0, 0, 0),
			["Peronospora"],
		],
		[
			new Date(2024, PERONOSPORA_SENSITIVITY_MONTH_MIN, 24, 0, 0, 0),
			["Oidium", "Peronospora"],
		],
		[new Date(2024, OIDIUM_SENSITIVITY_MONTH_MAX - 1, 24, 0, 0, 0), ["Oidium"]],
		[
			new Date(2024, PERONOSPORA_SENSITIVITY_MONTH_MAX - 1, 24, 0, 0, 0),
			["Oidium", "Peronospora"],
		],
		[new Date(2024, OIDIUM_SENSITIVITY_MONTH_MAX, 24, 0, 0, 0), []],
	])("getCurrentDiseases", async (currentDate, expectedDiseases) => {
		const diseases = await getCurrentDiseases(currentDate);
		expect(diseases.map((d) => d.name)).toEqual(expectedDiseases);
	});
});
