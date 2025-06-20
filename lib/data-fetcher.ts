import { TreatmentStatus } from "@prisma/client";
import { cache } from "react";
import { prisma } from "./prisma";

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
				select: {
					dose: true,
					product: {
						select: {
							id: true,
							name: true,
							composition: {
								select: {
									dose: true,
									substance: {
										select: {
											name: true,
											maxDosage: true,
										},
									},
								},
							},
						},
					},
				},
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
					substance: {
						select: {
							name: true,
							maxDosage: true,
						},
					},
				},
			},
		},
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
			productApplications: { select: productApplicationsSelect },
		},
		where: {
			appliedDate: {
				gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
			},
		},
		orderBy: [{ status: "asc" as const }, { appliedDate: "desc" as const }],
	},
};

// Optimized select for treatments list
const treatmentSelect = {
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
			throw new Error(`Parcel ${parcelId} not found`);
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
		orderBy: [{ status: "asc" as const }, { dateMin: "asc" as const }],
	});
});

export type TreatmentType = Awaited<ReturnType<typeof getTreatments>>[number];
export type ParcelWithTreatments = Awaited<
	ReturnType<typeof getParcels>
>[number];
export type ParcelDetailType = Awaited<ReturnType<typeof getParcelDetail>>;
