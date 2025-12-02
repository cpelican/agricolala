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
		const { pastTreatment, COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS } =
			testData;
		// we cannot mock the date since the server is inside another node process
		// and it uses new Date as well to know which diseases are currently active
		const currentDate = new Date();
		const lastTreatmentDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate() -
				(COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS - 2),
		);

		await testPrisma.treatment.update({
			where: { id: pastTreatment.id },
			data: {
				appliedDate: lastTreatmentDate,
				diseaseIds: [testData.peronospora.id, testData.oidium.id],
			},
		});

		await testPrisma.disease.update({
			where: { id: testData.oidium.id },
			data: {
				name: "Oidium",
				description: "Powdery mildew, a fungal disease affecting grapevines",
				sensitivityMonthMin: currentDate.getMonth() - 2,
				sensitivityMonthMax: currentDate.getMonth() + 3,
			},
		});

		await testPrisma.disease.update({
			where: { id: testData.peronospora.id },
			data: {
				sensitivityMonthMin: currentDate.getMonth() - 2,
				sensitivityMonthMax: currentDate.getMonth() + 3,
			},
		});
		const previousTreatmentsCount = await testPrisma.treatment.count();

		// Simulate the cron job query logic by calling its endpoint
		const response = await fetch(
			"http://localhost:3001/api/cron/suggest-treatments",
			{
				headers: {
					Authorization: `Bearer ${process.env.CRON_SECRET}`,
				},
			},
		);
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
		// we cannot mock the date since the server is inside another node process
		// and it uses new Date as well to know which diseases are currently active
		const currentDate = new Date();
		const lastTreatmentDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate() - COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS,
		);

		await testPrisma.treatment.update({
			where: { id: pastTreatment.id },
			data: {
				appliedDate: lastTreatmentDate,
				diseaseIds: [testData.peronospora.id, testData.oidium.id],
			},
		});

		await testPrisma.disease.update({
			where: { id: testData.oidium.id },
			data: {
				name: "Oidium",
				description: "Powdery mildew, a fungal disease affecting grapevines",
				sensitivityMonthMin: currentDate.getMonth() - 2,
				sensitivityMonthMax: currentDate.getMonth() + 3,
			},
		});

		await testPrisma.disease.update({
			where: { id: testData.peronospora.id },
			data: {
				sensitivityMonthMin: currentDate.getMonth() - 2,
				sensitivityMonthMax: currentDate.getMonth() + 3,
			},
		});

		const previousTreatmentsCount = await testPrisma.treatment.count();

		const response = await fetch(
			"http://localhost:3001/api/cron/suggest-treatments",
			{
				headers: {
					Authorization: `Bearer ${process.env.CRON_SECRET}`,
				},
			},
		);
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
		expect(createdTreatment.dateMin?.getDate()).toBe(currentDate.getDate());
		expect(createdTreatment.dateMax?.getDate()).toBe(
			currentDate.getDate() + COPPER_TEST_PRODUCT_DAYS_BETWEEN_APPLICATIONS,
		);
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
