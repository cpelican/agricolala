import { describe, test, expect, beforeEach } from "vitest";
import { type PrismaClient } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { updateSubstanceAggregations } from "./update-substance-aggregations/core";
import { calculateSubstanceData } from "./substance-helpers";
import { getCachedCompositions } from "./data-fetcher";

const TEST_YEAR = 2024;
const HECTARE_IN_METERS = 10_000;

function pureActiveSubstanceGrams(
	productDose: number,
	compositionPercent: number,
) {
	return productDose * (compositionPercent / 100);
}

function perHaGrams(pureActiveSubstanceGrams: number, parcelAreaM2: number) {
	return (pureActiveSubstanceGrams * HECTARE_IN_METERS) / parcelAreaM2;
}

async function setTreatmentDate(
	testPrisma: PrismaClient,
	treatmentId: string,
	date: Date,
) {
	await testPrisma.treatment.update({
		where: { id: treatmentId },
		data: { appliedDate: date, status: "DONE" },
	});
}

describe("[Integration] updateSubstanceAggregations", () => {
	let testPrisma: PrismaClient;
	let testData: Awaited<ReturnType<typeof seedTestData>>;

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
		testData = await seedTestData();
	});

	test("creates user and parcel aggregations from DONE treatments in the given year", async () => {
		const { testUser, testParcel, pastTreatment } = testData;
		const appliedDate = new Date(TEST_YEAR, 5, 15);
		await setTreatmentDate(testPrisma, pastTreatment.id, appliedDate);

		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);

		const parcelAreaM2 = testParcel.width * testParcel.height;
		const copperPure = pureActiveSubstanceGrams(5, 25);
		const sulfurPure = pureActiveSubstanceGrams(3, 80);

		const userAggregations = await testPrisma.userSubstanceAggregation.findMany(
			{
				where: { userId: testUser.id, year: TEST_YEAR },
				orderBy: { substanceName: "asc" },
			},
		);
		expect(userAggregations).toHaveLength(2);
		expect(userAggregations[0]).toMatchObject({
			substanceName: "Copper",
			totalDoseOfProduct: 5,
			totalUsedOfPureActiveSubstance: copperPure,
			totalUsedOfPureActiveSubstancePerHa: perHaGrams(copperPure, parcelAreaM2),
			applicationCount: 1,
		});
		expect(userAggregations[0].monthlyData[appliedDate.getMonth()]).toBeCloseTo(
			copperPure,
		);
		expect(userAggregations[1]).toMatchObject({
			substanceName: "Sulfur",
			totalDoseOfProduct: 3,
			applicationCount: 1,
		});
		expect(userAggregations[1].totalUsedOfPureActiveSubstance).toBeCloseTo(
			sulfurPure,
		);
		expect(userAggregations[1].totalUsedOfPureActiveSubstancePerHa).toBeCloseTo(
			perHaGrams(sulfurPure, parcelAreaM2),
		);

		const parcelAggregations =
			await testPrisma.parcelSubstanceAggregation.findMany({
				where: { parcelId: testParcel.id, year: TEST_YEAR },
				orderBy: { substanceName: "asc" },
			});
		expect(parcelAggregations).toHaveLength(2);
		expect(parcelAggregations[0].totalUsedOfPureActiveSubstance).toBeCloseTo(
			copperPure,
		);
		expect(parcelAggregations[1].totalUsedOfPureActiveSubstance).toBeCloseTo(
			sulfurPure,
		);
	});

	test("ignores TODO treatments and treatments outside the specified year", async () => {
		const { testUser, testParcel, pastTreatment, copperProduct } = testData;
		await setTreatmentDate(
			testPrisma,
			pastTreatment.id,
			new Date(TEST_YEAR, 3, 10),
		);

		await testPrisma.treatment.create({
			data: {
				parcelId: testParcel.id,
				userId: testUser.id,
				status: "TODO",
				appliedDate: new Date(TEST_YEAR, 4, 1),
				waterDose: 10,
				diseaseIds: [testData.peronospora.id],
				productApplications: {
					create: [{ productId: copperProduct.id, dose: 100 }],
				},
			},
		});

		await testPrisma.treatment.create({
			data: {
				parcelId: testParcel.id,
				userId: testUser.id,
				status: "DONE",
				appliedDate: new Date(TEST_YEAR - 1, 6, 1),
				waterDose: 10,
				diseaseIds: [testData.peronospora.id],
				productApplications: {
					create: [{ productId: copperProduct.id, dose: 200 }],
				},
			},
		});

		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);

		const copperAggregationBeforeUpdate =
			await testPrisma.userSubstanceAggregation.findFirst({
				where: {
					userId: testUser.id,
					year: TEST_YEAR,
					substanceName: "Copper",
				},
			});
		expect(copperAggregationBeforeUpdate?.totalDoseOfProduct).toBe(5);
		expect(copperAggregationBeforeUpdate?.applicationCount).toBe(1);

		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);

		const copperAggregation =
			await testPrisma.userSubstanceAggregation.findFirst({
				where: {
					userId: testUser.id,
					year: TEST_YEAR,
					substanceName: "Copper",
				},
			});
		expect(copperAggregation?.totalDoseOfProduct).toBe(5);
		expect(copperAggregation?.applicationCount).toBe(1);
	});

	test("replaces stale aggregations for the year on re-run", async () => {
		const { testUser, testParcel, pastTreatment } = testData;
		await setTreatmentDate(
			testPrisma,
			pastTreatment.id,
			new Date(TEST_YEAR, 2, 1),
		);

		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);
		// Manually corrupt the aggregations
		await testPrisma.userSubstanceAggregation.updateMany({
			where: { userId: testUser.id, year: TEST_YEAR },
			data: { totalDoseOfProduct: 999, applicationCount: 99 },
		});
		await testPrisma.parcelSubstanceAggregation.updateMany({
			where: { parcelId: testParcel.id, year: TEST_YEAR },
			data: { totalDoseOfProduct: 999, applicationCount: 99 },
		});

		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);
		// the computation relies on the treatments data, so the corruption on the aggregation disapears.
		const copperUserAggregation =
			await testPrisma.userSubstanceAggregation.findFirst({
				where: {
					userId: testUser.id,
					year: TEST_YEAR,
					substanceName: "Copper",
				},
			});
		const copperParcelAggregation =
			await testPrisma.parcelSubstanceAggregation.findFirst({
				where: {
					parcelId: testParcel.id,
					year: TEST_YEAR,
					substanceName: "Copper",
				},
			});

		expect(copperUserAggregation?.totalDoseOfProduct).toBe(5);
		expect(copperUserAggregation?.applicationCount).toBe(1);
		expect(copperParcelAggregation?.totalDoseOfProduct).toBe(5);
		expect(copperParcelAggregation?.applicationCount).toBe(1);
	});

	test("clears aggregations for the year when there are no DONE treatments", async () => {
		const { testUser, testParcel, copper, pastTreatment } = testData;
		await setTreatmentDate(
			testPrisma,
			pastTreatment.id,
			new Date(TEST_YEAR, 1, 1),
		);
		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);

		await testPrisma.treatment.delete({ where: { id: pastTreatment.id } });

		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);

		expect(
			await testPrisma.userSubstanceAggregation.count({
				where: { userId: testUser.id, year: TEST_YEAR },
			}),
		).toBe(0);
		expect(
			await testPrisma.parcelSubstanceAggregation.count({
				where: { parcelId: testParcel.id, year: TEST_YEAR },
			}),
		).toBe(0);

		// Sanity: unrelated seeded substance still exists for future aggregations.
		expect(
			await testPrisma.substance.findUnique({ where: { id: copper.id } }),
		).not.toBeNull();
	});

	test("does not delete aggregations from other years", async () => {
		const { testUser, testParcel, pastTreatment, copper } = testData;
		const otherYear = TEST_YEAR - 1;

		await testPrisma.userSubstanceAggregation.create({
			data: {
				userId: testUser.id,
				substanceId: copper.id,
				substanceName: "Copper",
				year: otherYear,
				totalDoseOfProduct: 42,
				applicationCount: 3,
			},
		});
		await testPrisma.parcelSubstanceAggregation.create({
			data: {
				parcelId: testParcel.id,
				substanceId: copper.id,
				substanceName: "Copper",
				year: otherYear,
				totalDoseOfProduct: 42,
				applicationCount: 3,
			},
		});

		await setTreatmentDate(
			testPrisma,
			pastTreatment.id,
			new Date(TEST_YEAR, 7, 1),
		);
		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);

		const otherYearUserAggregation =
			await testPrisma.userSubstanceAggregation.findFirst({
				where: {
					userId: testUser.id,
					year: otherYear,
					substanceName: "Copper",
				},
			});
		const otherYearParcelAggregation =
			await testPrisma.parcelSubstanceAggregation.findFirst({
				where: {
					parcelId: testParcel.id,
					year: otherYear,
					substanceName: "Copper",
				},
			});

		expect(otherYearUserAggregation?.totalDoseOfProduct).toBe(42);
		expect(otherYearParcelAggregation?.totalDoseOfProduct).toBe(42);
	});

	test("computes surface-weighted user per-ha across multiple parcels", async () => {
		const { testUser, copperProduct, peronospora } = testData;

		const parcelSmall = await testPrisma.parcel.create({
			data: {
				name: "Small parcel",
				latitude: 44.1,
				longitude: 9.7,
				width: 10,
				height: 10,
				type: "VINEYARD",
				userId: testUser.id,
			},
		});
		const parcelLarge = await testPrisma.parcel.create({
			data: {
				name: "Large parcel",
				latitude: 44.2,
				longitude: 9.8,
				width: 20,
				height: 20,
				type: "VINEYARD",
				userId: testUser.id,
			},
		});

		const productDose = 20;
		const compositionPercent = 25;
		const appliedDate = new Date(TEST_YEAR, 3, 12);

		for (const parcelId of [parcelSmall.id, parcelLarge.id]) {
			await testPrisma.treatment.create({
				data: {
					parcelId,
					userId: testUser.id,
					status: "DONE",
					appliedDate,
					waterDose: 10,
					diseaseIds: [peronospora.id],
					productApplications: {
						create: [{ productId: copperProduct.id, dose: productDose }],
					},
				},
			});
		}

		await updateSubstanceAggregations(testPrisma, testUser.id, TEST_YEAR);

		const copperSubstanceId = (
			await testPrisma.substanceDose.findFirst({
				where: { productId: copperProduct.id },
				select: { substanceId: true },
			})
		)?.substanceId;
		expect(copperSubstanceId).toBeDefined();

		const compositions = await getCachedCompositions();
		const bothTreatments = [parcelSmall, parcelLarge].map((parcel, index) => ({
			id: `treatment-${index}`,
			appliedDate,
			parcelId: parcel.id,
			parcelName: parcel.name,
			parcel: { width: parcel.width, height: parcel.height },
			productApplications: [
				{
					dose: productDose,
					product: {
						id: copperProduct.id,
						composition: [
							{ dose: compositionPercent, substanceId: copperSubstanceId! },
						],
					},
				},
			],
		}));
		const expectedBoth = calculateSubstanceData(bothTreatments, compositions);
		const expectedSmall = calculateSubstanceData(
			[bothTreatments[0]],
			compositions,
		);
		const expectedLarge = calculateSubstanceData(
			[bothTreatments[1]],
			compositions,
		);

		const userCopper = await testPrisma.userSubstanceAggregation.findFirst({
			where: {
				userId: testUser.id,
				year: TEST_YEAR,
				substanceName: "Copper",
			},
		});
		const smallCopper = await testPrisma.parcelSubstanceAggregation.findFirst({
			where: {
				parcelId: parcelSmall.id,
				year: TEST_YEAR,
				substanceName: "Copper",
			},
		});
		const largeCopper = await testPrisma.parcelSubstanceAggregation.findFirst({
			where: {
				parcelId: parcelLarge.id,
				year: TEST_YEAR,
				substanceName: "Copper",
			},
		});

		expect(userCopper).toMatchObject({
			totalDoseOfProduct: expectedBoth[0].totalDoseOfProduct,
			totalUsedOfPureActiveSubstance:
				expectedBoth[0].totalUsedOfPureActiveSubstance,
			totalUsedOfPureActiveSubstancePerHa:
				expectedBoth[0].totalUsedOfPureActiveSubstancePerHaGrams,
			applicationCount: 2,
		});
		expect(smallCopper?.totalUsedOfPureActiveSubstancePerHa).toBe(
			expectedSmall[0].totalUsedOfPureActiveSubstancePerHaGrams,
		);
		expect(largeCopper?.totalUsedOfPureActiveSubstancePerHa).toBe(
			expectedLarge[0].totalUsedOfPureActiveSubstancePerHaGrams,
		);
		expect(smallCopper?.totalUsedOfPureActiveSubstancePerHa).not.toBe(
			userCopper?.totalUsedOfPureActiveSubstancePerHa,
		);
	});
});
