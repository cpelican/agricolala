import { describe, test, expect, beforeEach } from "vitest";
import {
	type PrismaClient,
	PhenologicalStage,
	ProductDoseUnit,
	TreatmentStatus,
} from "@prisma/client";
import {
	cleanDatabase,
	OIDIUM_SENSITIVITY_MONTH_MAX,
	PERONOSPORA_SENSITIVITY_MONTH_MAX,
	PERONOSPORA_SENSITIVITY_MONTH_MIN,
	seedTestData,
} from "../../../../test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import {
	getCachedDiseaseStageSensitivities,
	getCachedDiseaseWindows,
} from "@/lib/data-fetcher";
import { DEFAULT_DAYS_BETWEEN_APPLICATIONS } from "@/lib/coverage-helpers";
import { getActiveDiseaseIds } from "@/lib/disease-stage-sensitivity";
import { CRITICAL_SUGGESTION_WINDOW_DAYS } from "@/lib/treatment-suggestions";

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

	test("creates one TODO for a shared parcel, authored by its last treatment's author", async () => {
		const {
			pastTreatment,
			testParcel,
			COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS,
		} = testData;
		const userB = await testPrisma.user.create({
			data: { email: "b@example.com", isAuthorized: true },
		});
		await testPrisma.parcelMember.create({
			data: { parcelId: testParcel.id, userId: userB.id },
		});
		// B recorded the parcel's last treatment.
		await testPrisma.treatment.update({
			where: { id: pastTreatment.id },
			data: {
				userId: userB.id,
				appliedDate: localMidnightDaysAgo(
					CRON_AS_OF_IN_SEASON,
					COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS + 2,
				),
			},
		});

		const response = await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.suggestedTreatments).toBe(1);
		const todos = await testPrisma.treatment.findMany({
			where: { status: TreatmentStatus.TODO },
		});
		expect(todos).toEqual([
			expect.objectContaining({ parcelId: testParcel.id, userId: userB.id }),
		]);
	});

	test("should create a TODO treatment using the default interval when the product has no daysBetweenApplications", async () => {
		const { pastTreatment, copper, testParcel, testUser } = testData;
		const liquidProduct = await testPrisma.product.create({
			data: {
				name: "Test Liquid Copper Product",
				brand: "Test Brand",
				maxApplications: 6,
				doseUnit: ProductDoseUnit.MILLILITER,
				composition: {
					create: [{ substanceId: copper.id, dose: 10.0 }],
				},
			},
		});
		const lastTreatmentDate = localMidnightDaysAgo(
			CRON_AS_OF_IN_SEASON,
			DEFAULT_DAYS_BETWEEN_APPLICATIONS + 2,
		);

		await testPrisma.treatment.delete({ where: { id: pastTreatment.id } });
		await testPrisma.treatment.create({
			data: {
				parcelId: testParcel.id,
				userId: testUser.id,
				status: TreatmentStatus.DONE,
				appliedDate: lastTreatmentDate,
				waterDose: 10,
				diseaseIds: [testData.peronospora.id],
				productApplications: {
					create: [{ productId: liquidProduct.id, dose: 20 }],
				},
			},
		});

		const response = await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.message).toBe(`Created 1 suggested treatments`);

		const createdTreatments = await testPrisma.treatment.findMany({
			where: { status: TreatmentStatus.TODO },
			include: { productApplications: true },
		});
		expect(createdTreatments.length).toBe(1);
		expect(createdTreatments[0].productApplications).toEqual([
			expect.objectContaining({ productId: liquidProduct.id, dose: 20 }),
		]);

		const { dateMin: expectedDateMin } = expectedSuggestedDateRange(
			lastTreatmentDate,
			DEFAULT_DAYS_BETWEEN_APPLICATIONS,
		);
		expect(createdTreatments[0].dateMin?.toISOString().slice(0, 10)).toBe(
			expectedDateMin.toISOString().slice(0, 10),
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
	])("month windows apply without a stage (%s)", async (currentDate, expectedDiseases) => {
		const [diseases, sensitivities] = await Promise.all([
			getCachedDiseaseWindows(),
			getCachedDiseaseStageSensitivities(),
		]);
		const activeIds = getActiveDiseaseIds(
			diseases,
			sensitivities,
			[],
			currentDate,
		);
		expect(
			diseases.filter((d) => activeIds.has(d.id)).map((d) => d.name),
		).toEqual(expectedDiseases);
	});

	describe("by phenological stage", () => {
		async function recordStage(stage: PhenologicalStage, asOf: Date) {
			await testPrisma.phenologyObservation.create({
				data: {
					parcelId: testData.testParcel.id,
					stage,
					observedAt: localMidnightDaysAgo(asOf, 2),
				},
			});
		}

		async function setLastTreatmentDaysAgo(asOf: Date, days: number) {
			const appliedDate = localMidnightDaysAgo(asOf, days);
			await testPrisma.treatment.update({
				where: { id: testData.pastTreatment.id },
				data: {
					appliedDate,
					diseaseIds: [testData.peronospora.id, testData.oidium.id],
				},
			});
			return appliedDate;
		}

		async function getTodoTreatments() {
			return testPrisma.treatment.findMany({
				where: { status: TreatmentStatus.TODO },
				include: { productApplications: true },
			});
		}

		test("the stage overrides the month window: small berries in January is suggested", async () => {
			await setLastTreatmentDaysAgo(CRON_AS_OF_OUT_OF_SEASON, 10);
			await recordStage(PhenologicalStage.FRUIT_SET, CRON_AS_OF_OUT_OF_SEASON);

			const response = await fetchSuggestTreatments(CRON_AS_OF_OUT_OF_SEASON);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.message).toBe(`Created 1 suggested treatments`);
		});

		test("no suggestion at colour change, although June is in the month windows", async () => {
			await setLastTreatmentDaysAgo(CRON_AS_OF_IN_SEASON, 10);
			await recordStage(PhenologicalStage.VERAISON, CRON_AS_OF_IN_SEASON);

			const response = await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.message).toBe(`Created 0 suggested treatments`);
		});

		test("sulfur is still suggested at bunch closing", async () => {
			await setLastTreatmentDaysAgo(CRON_AS_OF_IN_SEASON, 10);
			await recordStage(PhenologicalStage.BUNCH_CLOSURE, CRON_AS_OF_IN_SEASON);

			await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);

			const [todo] = await getTodoTreatments();
			expect(todo.productApplications.map((pa) => pa.productId)).toContain(
				testData.sulfurProduct.id,
			);
		});

		test("at small berries, every product comes back at the shortest interval within a short window", async () => {
			const { COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS } = testData;
			// Copper's interval (7 days) has elapsed, sulfur's (8 days) has not.
			const appliedDate = await setLastTreatmentDaysAgo(
				CRON_AS_OF_IN_SEASON,
				COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS,
			);
			await recordStage(PhenologicalStage.FRUIT_SET, CRON_AS_OF_IN_SEASON);

			await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);

			const todos = await getTodoTreatments();
			expect(todos).toHaveLength(1);
			expect(
				todos[0].productApplications.map((pa) => pa.productId).sort(),
			).toEqual([testData.copperProduct.id, testData.sulfurProduct.id].sort());
			const { dateMin } = expectedSuggestedDateRange(
				appliedDate,
				COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS,
			);
			const dateMax = new Date(dateMin);
			dateMax.setDate(dateMax.getDate() + CRITICAL_SUGGESTION_WINDOW_DAYS);
			expect(todos[0].dateMin?.toISOString().slice(0, 10)).toBe(
				dateMin.toISOString().slice(0, 10),
			);
			expect(todos[0].dateMax?.toISOString().slice(0, 10)).toBe(
				dateMax.toISOString().slice(0, 10),
			);
		});

		test("at flowering, copper is left out and sulfur still suggested", async () => {
			await setLastTreatmentDaysAgo(CRON_AS_OF_IN_SEASON, 10);
			await recordStage(PhenologicalStage.FLOWERING, CRON_AS_OF_IN_SEASON);

			await fetchSuggestTreatments(CRON_AS_OF_IN_SEASON);

			const todos = await getTodoTreatments();
			expect(todos).toHaveLength(1);
			expect(todos[0].productApplications.map((pa) => pa.productId)).toEqual([
				testData.sulfurProduct.id,
			]);
		});
	});
});
