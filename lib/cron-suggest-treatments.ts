import { TreatmentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import {
	getAuthorizedUsersWithLastTreatments,
	getCachedCompositions,
	getCachedDiseaseStageSensitivities,
	getCachedDiseaseWindows,
} from "./data-fetcher";
import { getActiveDiseaseIds } from "./disease-stage-sensitivity";
import { buildTreatmentSuggestion } from "./treatment-suggestions";

// Replaces every TODO treatment with a fresh suggestion per parcel.
export async function suggestTreatments(currentDate: Date) {
	let suggestedTreatments = 0;

	// Delete all TODO treatments
	// We want a one to one type relationship for todo treatment with the parcel
	// it is easier / simpler to re-create the todo rather than update it
	const [, users, compositions, diseases, sensitivities] = await Promise.all([
		prisma.treatment.deleteMany({
			where: {
				status: TreatmentStatus.TODO,
			},
		}),
		getAuthorizedUsersWithLastTreatments(currentDate),
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

	for (const user of users) {
		for (const parcel of user.parcels) {
			const lastTreatment = parcel.treatments[0];
			if (!lastTreatment) continue;

			// Diseases are active by the parcel's stage, or by month without one.
			const stage = parcel.phenologyObservations[0]?.stage ?? null;
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
					userId: user.id,
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
	}

	return { suggestedTreatments, processedUsers: users.length };
}
