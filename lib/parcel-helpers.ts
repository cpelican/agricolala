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
	treatments: {
		select: {
			id: true,
			appliedDate: true,
			dateMin: true,
			dateMax: true,
			status: true,
			waterDose: true,
			diseaseIds: true,
			parcel: {
				select: {
					name: true,
				},
			},
			productApplications: {
				select: {
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
				},
			},
		},
	},
};

export const getParcelDetail = cache(
	async (parcelId: string, userId: string) => {
		const parcel = await prisma.parcel.findUnique({
			where: { id: parcelId, userId },
			select: parcelSelect,
		});

		if (!parcel) {
			throw new Error(`Parcel ${parcelId} not found`);
		}

		return parcel;
	},
);

export const getParcels = cache(async (userId: string) => {
	return await prisma.parcel.findMany({
		where: { userId },
		include: {
			treatments: {
				include: {
					productApplications: {
						include: {
							product: {
								include: {
									composition: {
										include: {
											substance: true,
										},
									},
								},
							},
						},
					},
					parcel: true,
				},
				where: {
					status: TreatmentStatus.DONE,
					appliedDate: {
						gte: new Date(new Date().getFullYear(), 0, 1),
						lte: new Date(new Date().getFullYear(), 11, 31),
					},
				},
			},
		},
	});
});

export type ParcelWithTreatments = Awaited<
	ReturnType<typeof getParcels>
>[number];

export type ParcelDetail = Awaited<ReturnType<typeof getParcelDetail>>;
