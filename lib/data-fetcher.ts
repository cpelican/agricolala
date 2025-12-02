import { TreatmentStatus, type UserSubstanceAggregation } from "@prisma/client";
import { cache } from "react";
import { prisma } from "./prisma";
import { Errors } from "@/lib/constants";

const productApplicationsSelect = {
	dose: true,
	product: {
		select: {
			id: true,
			name: true,
			brand: true,
			composition: {
				select: {
					dose: true,
					substanceId: true,
				},
			},
		},
	},
};

const parcelSelect = {
	id: true,
	name: true,
	latitude: true,
	longitude: true,
	width: true,
	height: true,
	type: true,
	createdAt: true,
	updatedAt: true,
	treatments: {
		select: {
			id: true,
			appliedDate: true,
			status: true,
			productApplications: {
				select: productApplicationsSelect,
			},
		},
		where: {
			status: TreatmentStatus.DONE,
			appliedDate: {
				gte: new Date(new Date().getFullYear(), 0, 1),
				lte: new Date(new Date().getFullYear(), 11, 31),
			},
		},
		take: 5, // Limit treatments per parcel for performance
	},
};

const parcelDetailSelect = {
	id: true,
	name: true,
	latitude: true,
	longitude: true,
	width: true,
	height: true,
	type: true,
	createdAt: true,
	updatedAt: true,
	treatments: {
		select: {
			id: true,
			appliedDate: true,
			dateMin: true,
			dateMax: true,
			status: true,
			waterDose: true,
			diseaseIds: true,
			productApplications: {
				select: productApplicationsSelect,
			},
		},
		where: {
			appliedDate: {
				gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
			},
		},
		orderBy: [{ status: "asc" as const }, { appliedDate: "desc" as const }],
	},
};

export const treatmentSelect = {
	id: true,
	appliedDate: true,
	dateMin: true,
	dateMax: true,
	status: true,
	waterDose: true,
	diseaseIds: true,
	parcel: {
		select: {
			id: true,
			name: true,
		},
	},
	productApplications: {
		select: productApplicationsSelect,
	},
};

export const getParcels = cache(async (userId: string) => {
	return await prisma.parcel.findMany({
		where: { userId },
		select: parcelSelect,
		orderBy: { createdAt: "desc" },
	});
});

export const getParcelDetail = cache(
	async (parcelId: string, userId: string) => {
		const parcel = await prisma.parcel.findUnique({
			where: { id: parcelId, userId },
			select: parcelDetailSelect,
		});

		if (!parcel) {
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}

		return parcel;
	},
);

export const getTreatments = cache(async (userId: string) => {
	return await prisma.treatment.findMany({
		where: {
			userId,
			OR: [
				// Treatments with appliedDate in current year (January onwards)
				{
					appliedDate: {
						gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
					},
				},
				// Treatments with dateMin in current year (for scheduled treatments)
				{
					dateMin: {
						gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
					},
				},
			],
		},
		select: treatmentSelect,
		orderBy: [{ appliedDate: "desc" as const }, { dateMin: "desc" as const }],
	});
});

export const getCachedDiseases = cache(async () => {
	return prisma.disease.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});
});

export const getCachedProducts = cache(async () => {
	return prisma.product.findMany({
		select: { id: true, name: true, maxApplications: true },
		orderBy: { name: "asc" },
	});
});

const substanceToColors = {
	Copper: "rgb(59, 130, 246)",
	Sulfur: "rgb(34, 197, 94)",
} as const;

export const getCachedCompositions = cache(async () => {
	const compositions = await prisma.substanceDose.findMany({
		select: {
			id: true,
			dose: true,
			productId: true,
			substanceId: true,
			substance: {
				select: {
					name: true,
					maxDosage: true,
				},
			},
		},
	});

	return compositions.reduce(
		(
			acc: Record<string, Record<string, (typeof compositions)[number]>>,
			value,
		) => {
			if (!acc[value.substanceId]) {
				acc[value.substanceId] = {};
			}
			// a product cannot be composed of 2 same substances
			acc[value.substanceId][value.productId] = value;
			if (!acc[value.productId]) {
				acc[value.productId] = {};
			}
			acc[value.productId][value.substanceId] = value;
			return acc;
		},
		{},
	);
});

export const getCachedSubstances = cache(async () => {
	const substances = await prisma.substance.findMany({
		select: { id: true, name: true, maxDosage: true },
		orderBy: { name: "asc" },
	});

	return substances.map((substance) => {
		if (substance.name in substanceToColors) {
			return {
				...substance,
				color:
					substanceToColors[substance.name as keyof typeof substanceToColors],
			};
		}
		return { ...substance, color: "rgb(182, 182, 182)" };
	});
});

export const getCachedSubstanceAggregations = cache(
	async (userId: string, year: number = new Date().getFullYear()) => {
		const aggregations = await prisma.userSubstanceAggregation.findMany({
			where: { userId, year },
			orderBy: { substanceName: "asc" },
		});

		return aggregations.map((agg) => ({
			name: agg.substanceName,
			totalDoseOfProduct: agg.totalDoseOfProduct,
			totalUsedOfPureActiveSubstance: agg.totalUsedOfPureActiveSubstance,
			totalUsedOfPureActiveSubstancePerHa:
				agg.totalUsedOfPureActiveSubstancePerHa,
			maxDosage: -1, // Will be filled from substances data
			monthlyData: agg.monthlyData,
			applicationCount: agg.applicationCount,
		}));
	},
);

export const getAllYearsSubstanceAggregations = cache(
	async (userId: string) => {
		const aggregations = await prisma.userSubstanceAggregation.findMany({
			where: { userId },
			orderBy: [{ year: "asc" }, { substanceName: "asc" }],
		});

		const yearData: Record<
			number,
			Record<
				string,
				Pick<
					UserSubstanceAggregation,
					| "totalDoseOfProduct"
					| "totalUsedOfPureActiveSubstance"
					| "totalUsedOfPureActiveSubstancePerHa"
					| "year"
				>
			>
		> = {};

		for (const agg of aggregations) {
			if (!yearData[agg.year]) {
				yearData[agg.year] = {};
			}
			yearData[agg.year][agg.substanceName] = {
				totalDoseOfProduct: agg.totalDoseOfProduct,
				totalUsedOfPureActiveSubstance: agg.totalUsedOfPureActiveSubstance,
				totalUsedOfPureActiveSubstancePerHa:
					agg.totalUsedOfPureActiveSubstancePerHa,
				year: agg.year,
			};
		}

		return yearData;
	},
);

export const getCachedParcelSubstanceAggregations = cache(
	async (parcelId: string, year: number = new Date().getFullYear()) => {
		const aggregations = await prisma.parcelSubstanceAggregation.findMany({
			where: { parcelId, year },
			orderBy: { substanceName: "asc" },
		});

		return aggregations.map((agg) => ({
			name: agg.substanceName,
			totalDoseOfProduct: agg.totalDoseOfProduct,
			totalUsedOfPureActiveSubstance: agg.totalUsedOfPureActiveSubstance,
			totalUsedOfPureActiveSubstancePerHa:
				agg.totalUsedOfPureActiveSubstancePerHa,
			maxDosage: -1, // Will be filled from substances data
			monthlyData: agg.monthlyData,
			applicationCount: agg.applicationCount,
		}));
	},
);

// Cache should not be a problem if it doesnt last too long
export const getCurrentDiseases = cache(
	async (
		testDate?: Date,
	): Promise<{ id: string; name?: string; substances: { id: string }[] }[]> => {
		const currentMonth = testDate
			? testDate.getMonth() + 1
			: new Date().getMonth() + 1;

		return await prisma.disease.findMany({
			select: {
				id: true,
				name: testDate ? true : false, // we need to fetch the name to be able to test it
				substances: {
					select: {
						id: true,
					},
				},
			},
			where: {
				sensitivityMonthMin: {
					lte: currentMonth,
				},
				sensitivityMonthMax: {
					gte: currentMonth,
				},
			},
		});
	},
);

export type TreatmentType = Awaited<ReturnType<typeof getTreatments>>[number];
export type ParcelWithTreatments = Awaited<
	ReturnType<typeof getParcels>
>[number];
export type ParcelDetailType = Awaited<ReturnType<typeof getParcelDetail>>;
