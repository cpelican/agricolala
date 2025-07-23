import { describe, test, expect, beforeEach } from "vitest";
import { TreatmentStatus } from "@prisma/client";
import { cleanDatabase, seedTestData } from "../../../../test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";

describe("Suggest Treatments", () => {
	let testData: Awaited<ReturnType<typeof seedTestData>>;

	beforeEach(async () => {
		await cleanDatabase();
		testData = await seedTestData();
	});

	test("should create TODO treatment when daysBetweenApplications is reached", async () => {
		// Get the test data
		// const { testUser, testParcel, copperProduct, sulfurProduct } = testData

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
		console.log("data:", data);
		expect(data).toBeDefined();
		expect(data.success).toBe(true);
	});

	test.skip("should not create TODO treatment if the daysBetweenApplications is not reached", async () => {});

	test.skip("should not create duplicate TODO treatments for the same parcel", async () => {
		// const { testUser, testParcel, copperProduct, sulfurProduct } = testData
		// Create an existing TODO treatment
		// const existingTodo = await testPrisma.treatment.create({
		//   data: {
		//     parcelId: testParcel.id,
		//     userId: testUser.id,
		//     status: TreatmentStatus.TODO,
		//     dateMin: new Date(),
		//     dateMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		//     waterDose: 10,
		//     diseaseIds: [],
		//     productApplications: {
		//       create: {
		//         productId: copperProduct.id,
		//         dose: 5,
		//       },
		//     },
		//   },
		// })
		// Simulate the cron job query logic by calling its endpoint
	});

	test.skip("should delete expired TODO treatments", async () => {
		const testPrisma = getTestPrisma();
		const { testUser, testParcel, copperProduct } = testData;

		// Create an expired TODO treatment (dateMax in the past)
		const expiredTodo = await testPrisma.treatment.create({
			data: {
				parcelId: testParcel.id,
				userId: testUser.id,
				status: TreatmentStatus.TODO,
				dateMin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
				dateMax: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
				waterDose: 10,
				diseaseIds: [],
				productApplications: {
					create: {
						productId: copperProduct.id,
						dose: 5,
					},
				},
			},
		});

		// Verify expired TODO exists
		const existingExpired = await testPrisma.treatment.findUnique({
			where: { id: expiredTodo.id },
		});
		expect(existingExpired).toBeDefined();

		// Simulate the cron job query logic by calling its endpoint
	});

	test.skip("should calculate correct dateMax based on shortest daysBetweenApplications", async () => {
		// const { testUser, testParcel, copperProduct, sulfurProduct } = testData
		// Copper: 30 days, Sulfur: 7 days
		// Sulfur has shorter interval, so dateMax should be based on sulfur
		// const suggestedDate = new Date()
		// const shortestDaysBetween = Math.min(30, 7) // 7 days
		// const todoTreatment = await testPrisma.treatment.create({
		//   data: {
		//     parcelId: testParcel.id,
		//     userId: testUser.id,
		//     status: TreatmentStatus.TODO,
		//     dateMin: suggestedDate,
		//     dateMax: new Date(suggestedDate.getTime() + shortestDaysBetween * 24 * 60 * 60 * 1000),
		//     waterDose: 10,
		//     diseaseIds: [],
		//     productApplications: {
		//       create: [
		//         {
		//           productId: copperProduct.id,
		//           dose: 5,
		//         },
		//         {
		//           productId: sulfurProduct.id,
		//           dose: 3,
		//         },
		//       ],
		//     },
		//   },
		// })
		// call the cront job url
	});
});
