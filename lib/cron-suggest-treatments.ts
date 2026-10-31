import { TreatmentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import {
	getParcelsWithLastTreatments,
	getCachedCompositions,
	getCachedDiseaseStageSensitivities,
	getCachedDiseaseWindows,
} from "./data-fetcher";
import { getActiveDiseaseIds } from "./disease-stage-sensitivity";
import { isObservationExpired } from "./phenology";
import { buildTreatmentSuggestion } from "./treatment-suggestions";

// Replaces every TODO treatment with a fresh suggestion per parcel: one TODO for a
// shared parcel, seen by all its members, authored by its last treatment's author (D4).
export async function suggestTreatments(currentDate: Date) {
	let suggestedTreatments = 0;

	// Delete all TODO treatments
	// We want a one to one type relationship for todo treatment with the parcel
	// it is easier / simpler to re-create the todo rather than update it
	const [, parcels, compositions, diseases, sensitivities] = await Promise.all([
		prisma.treatment.deleteMany({
			where: {
				status: TreatmentStatus.TODO,
			},
		}),
		getParcelsWithLastTreatments(currentDate),
		getCachedCompositions(),
		getCachedDiseaseWindows(),
		getCachedDiseaseStageSensitivities(),
	]);

	// Products that contain a substance fighting each disease.
	const productIdsByDiseaseId: Record<string, Set<string>> = {};
	for (const disease of diseases) {
		productIdsByDiseaseId[disease.id] = new Set(
			disease.substances.flatMap((substance) =>
				Object.keys(compositions[substance.id] ?? {}),
			),
		);
	}

	for (const parcel of parcels) {
		const lastTreatment = parcel.treatments[0];
		if (!lastTreatment) continue;

		// Diseases are active by the parcel's stage, or by month without one.
		const observation = parcel.phenologyObservations[0];
		const stage =
			observation && !isObservationExpired(observation, currentDate)
				? observation.stage
				: null;
		const suggestion = buildTreatmentSuggestion({
			lastTreatment,
			date: currentDate,
			stage,
			activeDiseaseIds: getActiveDiseaseIds(
				diseases,
				sensitivities,
				[stage],
				currentDate,
			),
			productIdsByDiseaseId,
			sensitivities,
		});
		if (!suggestion) continue;

		await prisma.treatment.create({
			data: {
				parcelId: parcel.id,
				userId: lastTreatment.userId,
				status: TreatmentStatus.TODO,
				dateMin: suggestion.dateMin,
				dateMax: suggestion.dateMax,
				waterDose: lastTreatment.waterDose || 10,
				diseaseIds: suggestion.diseaseIds,
				productApplications: {
					create: suggestion.productApplications,
				},
			},
		});

		suggestedTreatments++;
	}

	return { suggestedTreatments, processedParcels: parcels.length };
}
