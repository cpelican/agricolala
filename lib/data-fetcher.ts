import { TreatmentStatus } from "@prisma/client";
import { cache } from "react";
import { prisma } from "./prisma";

export * from "./data-fetcher-aggregations";
export * from "./data-fetcher-catalog";
export * from "./data-fetcher-coverage";

const productApplicationsSelect = {
	dose: true,
	product: {
		select: {
			id: true,
			name: true,
			brand: true,
			doseUnit: true,
			productLiterToKiloGramConversionRate: true,
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
	areaM2: true,
	boundary: true,
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
	areaM2: true,
	boundary: true,
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

export type TreatmentType = Awaited<ReturnType<typeof getTreatments>>[number];
export type ParcelWithTreatments = Awaited<
	ReturnType<typeof getParcels>
>[number];
export type ParcelDetailType = NonNullable<
	Awaited<ReturnType<typeof getParcelDetail>>
>;
