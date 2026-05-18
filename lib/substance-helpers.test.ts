import { calculateSubstanceData } from "./substance-helpers";
import { describe, test, expect } from "vitest";

const treatments = [
	{
		id: "1",
		appliedDate: new Date("2025-04-10"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "2",
		appliedDate: new Date("2025-04-18"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "3",
		appliedDate: new Date("2025-04-18"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "4",
		appliedDate: new Date("2025-04-24"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "5",
		appliedDate: new Date("2025-04-29"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "6",
		appliedDate: new Date("2025-05-08"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 30,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "7",
		appliedDate: new Date("2025-05-20"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 15,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "8",
		appliedDate: new Date("2025-05-23"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 15,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "9",
		appliedDate: new Date("2025-05-25"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 15,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "10",
		appliedDate: new Date("2025-05-27"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "11",
		appliedDate: new Date("2025-06-07"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "12",
		appliedDate: new Date("2025-06-15"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "13",
		appliedDate: new Date("2025-06-22"),
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
	{
		id: "14",
		parcelId: "parcel-1",
		parcelName: "Parcel 1",
		appliedDate: new Date("2025-06-07"),
		parcel: { width: 10, height: 10 },
		productApplications: [
			{
				dose: 20,
				product: {
					id: "product1",
					composition: [
						{
							dose: 25,
							substanceId: "1",
						},
					],
				},
			},
		],
	},
];

const compositions = {
	"1": {
		product1: {
			id: "1",
			substance: { name: "rame", maxDosage: 4 },
			dose: 25, // percentage
			substanceId: "1",
			productId: "product1",
		},
	},
};

const expected = [
	{
		name: "rame",
		totalDoseOfProduct: 275, // correct value in grams
		totalUsedOfPureActiveSubstance: 68.75, // should be 275 * (25 / 100 (product dose of substance))
		totalUsedOfPureActiveSubstancePerHaGrams: 6875, // (grams per hectare) this should be calculated based on the parcel size
		maxDosage: 4,
		monthlyData: [0, 0, 0, 25, 23.75, 20, 0, 0, 0, 0, 0, 0],
		applicationCount: 14,
	},
];

const HECTARE_IN_METERS = 10_000;

describe("calculateSubstanceData", () => {
	test("should calculate substance correctly with only one treatment", () => {
		const firstTreatment = treatments[0];
		const substanceData = calculateSubstanceData(
			[firstTreatment],
			compositions,
		);
		const pureActiveSubstanceDoseInGr =
			(firstTreatment.productApplications[0].dose *
				compositions["1"].product1.dose) /
			100;
		const parcelSizeInM2 =
			firstTreatment.parcel.width * firstTreatment.parcel.height;

		expect(substanceData).toEqual([
			{
				name: "rame",
				totalDoseOfProduct: firstTreatment.productApplications[0].dose,
				totalUsedOfPureActiveSubstance: pureActiveSubstanceDoseInGr,
				totalUsedOfPureActiveSubstancePerHaGrams:
					(pureActiveSubstanceDoseInGr * HECTARE_IN_METERS) / parcelSizeInM2,
				applicationCount: 1,
				monthlyData: [0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0],
				maxDosage: 4,
			},
		]);
	});

	test("should calculate substance data correctly with 2 treatments on one parcel", () => {
		const twoTreatments = treatments.slice(0, 2);
		const substanceData = calculateSubstanceData(twoTreatments, compositions);
		const parcelSizeInM2 =
			twoTreatments[0].parcel.width * twoTreatments[0].parcel.height;
		expect(parcelSizeInM2).toEqual(100);

		const substanceDataSnapshot = substanceData[0];
		expect(substanceDataSnapshot.totalDoseOfProduct).toEqual(40);
		expect(substanceDataSnapshot.totalUsedOfPureActiveSubstance).toEqual(10);
		expect(
			substanceDataSnapshot.totalUsedOfPureActiveSubstancePerHaGrams,
		).toEqual(1000);
		expect(substanceDataSnapshot.applicationCount).toEqual(2);
	});

	test("should calculate substance data correctly with 2 treatments on 2 parcels", () => {
		// Add total product on the total parcel size
		const twoTreatments = [
			treatments[0],
			{
				...treatments[1],
				parcelId: "parcel-2",
				parcelName: "Parcel 2",
				parcel: { width: 20, height: 20 },
			},
		];
		const substanceData = calculateSubstanceData(twoTreatments, compositions);
		const parcelSizeInM2 =
			twoTreatments[0].parcel.width * twoTreatments[0].parcel.height +
			twoTreatments[1].parcel.width * twoTreatments[1].parcel.height;

		expect(parcelSizeInM2).toEqual(500);

		const substanceDataSnapshot = substanceData[0];
		expect(substanceDataSnapshot.totalDoseOfProduct).toEqual(40); // 20 + 20
		expect(substanceDataSnapshot.totalUsedOfPureActiveSubstance).toEqual(10); // 40 * (25 / 100)
		expect(
			substanceDataSnapshot.totalUsedOfPureActiveSubstancePerHaGrams,
		).toEqual(
			200, // (10 * 10_000) / 500
		);
		expect(substanceDataSnapshot.applicationCount).toEqual(2);
	});

	test("should not multiply parcel area when multiple treatments share the same parcel", () => {
		const threeTreatments = treatments.slice(0, 3);
		const substanceData = calculateSubstanceData(threeTreatments, compositions);
		const parcelSizeInM2 =
			threeTreatments[0].parcel.width * threeTreatments[0].parcel.height;
		const totalPureActiveSubstance = 15; // 3 × 20g product × 25%

		expect(substanceData[0].totalUsedOfPureActiveSubstance).toEqual(
			totalPureActiveSubstance,
		);
		expect(substanceData[0].totalUsedOfPureActiveSubstancePerHaGrams).toEqual(
			(totalPureActiveSubstance * HECTARE_IN_METERS) / parcelSizeInM2,
		);
	});

	test("should calculate substance data correctly", () => {
		const substanceData = calculateSubstanceData(treatments, compositions);
		expect(substanceData).toEqual(expected);
	});
});
