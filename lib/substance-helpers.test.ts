import { calculateSubstanceData } from "./substance-helpers";
import { describe, test, expect } from "vitest";

const treatments = [
	{
		id: "1",
		appliedDate: new Date("2025-04-10"),
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
			dose: 25,
			substanceId: "1",
			productId: "product1",
		},
	},
};

const expected = [
	{
		name: "rame",
		totalDoseOfProduct: 275,
		totalUsedOfPureActiveSubstance: 68.75,
		totalUsedOfPureActiveSubstancePerHa: 6875,
		maxDosage: 4,
		monthlyData: [0, 0, 0, 25, 23.75, 20, 0, 0, 0, 0, 0, 0],
		applications: [
			{ date: new Date("2025-04-10"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-04-18"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-04-18"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-04-24"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-04-29"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-05-08"), dose: 30, parcel: "Parcel 1" },
			{ date: new Date("2025-05-20"), dose: 15, parcel: "Parcel 1" },
			{ date: new Date("2025-05-23"), dose: 15, parcel: "Parcel 1" },
			{ date: new Date("2025-05-25"), dose: 15, parcel: "Parcel 1" },
			{ date: new Date("2025-05-27"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-06-07"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-06-15"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-06-22"), dose: 20, parcel: "Parcel 1" },
			{ date: new Date("2025-06-07"), dose: 20, parcel: "Parcel 1" },
		],
	},
];

describe("calculateSubstanceData", () => {
	test("should calculate substance data correctly", () => {
		const substanceData = calculateSubstanceData(treatments, compositions);
		expect(substanceData).toEqual(expected);
	});
});
