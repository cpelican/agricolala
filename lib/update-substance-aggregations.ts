import "server-only";
import { prisma } from "./prisma";
import { calculateSubstanceData } from "./substance-helpers";
import { getCachedCompositions } from "./data-fetcher";
import {
	updateUserAggregations,
	updateParcelAggregations,
} from "./aggregation-utils";

export async function updateSubstanceAggregations(
	userId: string,
	year: number = new Date().getFullYear(),
) {
	// Get all treatments for the user in the specified year
	const treatments = await prisma.treatment.findMany({
		where: {
			userId,
			appliedDate: {
				gte: new Date(year, 0, 1),
				lte: new Date(year, 11, 31),
			},
			status: "DONE",
		},
		select: {
			id: true,
			appliedDate: true,
			parcelId: true,
			productApplications: {
				select: {
					dose: true,
					product: {
						select: {
							id: true,
							composition: {
								select: {
									dose: true,
									substanceId: true,
								},
							},
						},
					},
				},
			},
			parcel: {
				select: {
					width: true,
					height: true,
					name: true,
				},
			},
		},
	});

	// Group treatments by parcel for parcel-level aggregations
	const treatmentsByParcel = treatments.reduce(
		(acc, treatment) => {
			if (!acc[treatment.parcelId]) {
				acc[treatment.parcelId] = [];
			}
			acc[treatment.parcelId].push(treatment);
			return acc;
		},
		{} as Record<string, typeof treatments>,
	);

	// Calculate user-level aggregations (all treatments combined)
	const allTransformedTreatments = treatments.map((treatment) => ({
		id: treatment.id,
		appliedDate: treatment.appliedDate,
		parcelName: treatment.parcel.name,
		parcel: {
			width: treatment.parcel.width,
			height: treatment.parcel.height,
		},
		productApplications: treatment.productApplications.map((app) => ({
			dose: app.dose,
			product: {
				id: app.product.id,
				composition: app.product.composition.map((comp) => ({
					dose: comp.dose,
					substanceId: comp.substanceId,
				})),
			},
		})),
	}));

	const compositions = await getCachedCompositions();
	const userSubstanceData = calculateSubstanceData(
		allTransformedTreatments,
		compositions,
	);

	// Clear existing user-level aggregations for this year
	await prisma.userSubstanceAggregation.deleteMany({
		where: { userId, year },
	});

	// Update user-level aggregations
	await updateUserAggregations(userSubstanceData, userId, year);

	// Update parcel-level aggregations
	for (const [parcelId, parcelTreatments] of Object.entries(
		treatmentsByParcel,
	)) {
		const parcelTransformedTreatments = parcelTreatments.map((treatment) => ({
			id: treatment.id,
			appliedDate: treatment.appliedDate,
			parcelName: treatment.parcel.name,
			parcel: {
				width: treatment.parcel.width,
				height: treatment.parcel.height,
			},
			productApplications: treatment.productApplications.map((app) => ({
				dose: app.dose,
				product: {
					id: app.product.id,
					composition: app.product.composition.map((comp) => ({
						dose: comp.dose,
						substanceId: comp.substanceId,
					})),
				},
			})),
		}));

		const parcelSubstanceData = calculateSubstanceData(
			parcelTransformedTreatments,
			compositions,
		);

		// Clear existing parcel-level aggregations for this year
		await prisma.parcelSubstanceAggregation.deleteMany({
			where: { parcelId, year },
		});

		await updateParcelAggregations(parcelSubstanceData, parcelId, year);
	}
}
