import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TreatmentStatus } from "@prisma/client";

import {
	getCachedCompositions,
	getCachedDiseaseStageSensitivities,
	getCachedDiseaseWindows,
} from "@/lib/data-fetcher";
import { Errors } from "@/lib/constants";
import { getActiveDiseaseIds } from "@/lib/disease-stage-sensitivity";
import { getStageExpiryCutoff } from "@/lib/phenology";
import {
	buildTreatmentSuggestion,
	lastTreatmentSelect,
} from "@/lib/treatment-suggestions";

/** Vitest/CI only: x-cron-as-of when CRON_ALLOW_AS_OF=true and not Vercel production. */
function isCronAsOfOverrideAllowed(): boolean {
	return (
		process.env.CRON_ALLOW_AS_OF === "true" &&
		process.env.VERCEL_ENV !== "production"
	);
}

function resolveCronReferenceDate(request: NextRequest): Date {
	if (isCronAsOfOverrideAllowed()) {
		const asOf = request.headers.get("x-cron-as-of");
		if (asOf) {
			const parsed = new Date(asOf);
			if (!Number.isNaN(parsed.getTime())) {
				return parsed;
			}
		}
	}
	return new Date();
}

const getAuthorizedUsersWithLastTreatmentsData = async (
	referenceDate: Date,
) => {
	const year = referenceDate.getFullYear();
	return prisma.user.findMany({
		where: {
			isAuthorized: true,
		},
		select: {
			id: true,
			parcels: {
				select: {
					id: true,
					treatments: {
						where: {
							status: TreatmentStatus.DONE,
							appliedDate: {
								not: null,
								gte: new Date(year, 0, 1),
								lt: new Date(year + 1, 0, 1),
							},
						},
						orderBy: {
							appliedDate: "desc",
						},
						take: 1, // Get only the most recent treatment per parcel
						select: lastTreatmentSelect,
					},
					// Current stage: latest observation on or before the date, unless expired.
					phenologyObservations: {
						where: {
							observedAt: {
								lte: referenceDate,
								gte: getStageExpiryCutoff(referenceDate),
							},
						},
						orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
						take: 1,
						select: { stage: true },
					},
				},
			},
		},
	});
};

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 401 });
	}

	try {
		let suggestedTreatments = 0;
		const currentDate = resolveCronReferenceDate(request);

		// Delete all TODO treatments
		// We want a one to one type relationship for todo treatment with the parcel
		// it is easier / simpler to re-create the todo rather than update it
		const [, users, compositions, diseases, sensitivities] = await Promise.all([
			prisma.treatment.deleteMany({
				where: {
					status: TreatmentStatus.TODO,
				},
			}),
			getAuthorizedUsersWithLastTreatmentsData(currentDate),
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

		return NextResponse.json({
			success: true,
			message: `Created ${suggestedTreatments} suggested treatments`,
			suggestedTreatments,
			processedUsers: users.length,
		});
	} catch (error) {
		console.error("Error in cron job:", error);
		return NextResponse.json(
			{ error: Errors.INTERNAL_SERVER },
			{ status: 500 },
		);
	}
}
