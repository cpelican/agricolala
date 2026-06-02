import "server-only";
import { prisma } from "./prisma";
import { calculateSubstanceData } from "./substance-helpers";
import { getCachedCompositions } from "./data-fetcher";
import {
	updateUserAggregations,
	updateParcelAggregations,
} from "./aggregation-utils";

type TreatmentForAggregation = Awaited<
	ReturnType<typeof fetchTreatmentsForAggregation>
>[number];

function transformTreatmentForAggregation(treatment: TreatmentForAggregation) {
	return {
		id: treatment.id,
		appliedDate: treatment.appliedDate,
		parcelId: treatment.parcelId,
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
	};
}

async function fetchTreatmentsForAggregation(userId: string, year: number) {
	return prisma.treatment.findMany({
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
}

export async function updateSubstanceAggregations(
	userId: string,
	year: number = new Date().getFullYear(),
	options?: { affectedParcelIds?: string[] },
) {
	const treatments = await fetchTreatmentsForAggregation(userId, year);

	const treatmentsByParcel = treatments.reduce<
		Record<string, TreatmentForAggregation[]>
	>((acc, treatment) => {
		if (!acc[treatment.parcelId]) {
			acc[treatment.parcelId] = [];
		}
		acc[treatment.parcelId].push(treatment);
		return acc;
	}, {});

	const allTransformedTreatments = treatments.map(
		transformTreatmentForAggregation,
	);

	const compositions = await getCachedCompositions();
	const userSubstanceData = calculateSubstanceData(
		allTransformedTreatments,
		compositions,
	);

	// Clear existing user-level aggregations for this year
	await prisma.userSubstanceAggregation.deleteMany({
		where: { userId, year },
	});

	await updateUserAggregations(userSubstanceData, userId, year);

	const parcelIdsToUpdate =
		options?.affectedParcelIds ?? Object.keys(treatmentsByParcel);

	for (const parcelId of parcelIdsToUpdate) {
		const parcelTreatments = treatmentsByParcel[parcelId] ?? [];
		const parcelTransformedTreatments = parcelTreatments.map(
			transformTreatmentForAggregation,
		);

		const parcelSubstanceData = calculateSubstanceData(
			parcelTransformedTreatments,
			compositions,
		);

		await prisma.parcelSubstanceAggregation.deleteMany({
			where: { parcelId, year },
		});

		if (parcelSubstanceData.length > 0) {
			await updateParcelAggregations(parcelSubstanceData, parcelId, year);
		}
	}
}
