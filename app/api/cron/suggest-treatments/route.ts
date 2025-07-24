import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TreatmentStatus } from "@prisma/client";

import { getCachedCompositions, getCurrentDiseases } from "@/lib/data-fetcher";

const getAuthorizedUsersWithLastTreatmentsData = async () => {
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
								gte: new Date(new Date().getFullYear(), 0, 1), // Start of current year
								lt: new Date(new Date().getFullYear() + 1, 0, 1), // Start of next year
							},
						},
						orderBy: {
							appliedDate: "desc",
						},
						take: 1, // Get only the most recent treatment per parcel
						select: {
							id: true,
							appliedDate: true,
							waterDose: true,
							diseaseIds: true,
							productApplications: {
								select: {
									dose: true,
									product: {
										select: {
											id: true,
											daysBetweenApplications: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});
};

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		let suggestedTreatments = 0;
		const currentDate = new Date();

		// Delete all TODO treatments
		// We want a one to one type relationship for todo treatment with the parcel
		// it is easier / simpler to re-create the todo rather than update it
		await prisma.treatment.deleteMany({
			where: {
				status: TreatmentStatus.TODO,
			},
		});

		const users = await getAuthorizedUsersWithLastTreatmentsData();
		const compositions = await getCachedCompositions();

		for (const user of users) {
			for (const parcel of user.parcels) {
				if (parcel.treatments.length === 0) continue;

				const lastTreatment = parcel.treatments[0];

				if (!lastTreatment.appliedDate) continue;

				const daysSinceLastTreatment = Math.floor(
					(currentDate.getTime() - lastTreatment.appliedDate.getTime()) /
						(1000 * 60 * 60 * 24),
				);
				// Filter diseaseIds to only include currently active diseases
				const currentDiseases = await getCurrentDiseases();
				const { currentDiseaseIds, substancesByDiseaseId } =
					currentDiseases.reduce<{
						currentDiseaseIds: Set<string>;
						substancesByDiseaseId: Record<string, string[]>;
					}>(
						(acc, disease) => {
							acc.currentDiseaseIds.add(disease.id);
							acc.substancesByDiseaseId[disease.id] = disease.substances.map(
								(substance) => substance.id,
							);
							return acc;
						},
						{ currentDiseaseIds: new Set<string>(), substancesByDiseaseId: {} },
					);
				const filteredDiseaseIds = lastTreatment.diseaseIds.filter((id) =>
					currentDiseaseIds.has(id),
				);
				// Compute which products can be currently applied depending on the current diseases
				const productIdsCurrentlyValidToApply = new Set<string>();
				for (const diseaseId of filteredDiseaseIds) {
					const substances = substancesByDiseaseId[diseaseId];
					for (const substanceId of substances) {
						for (const productId of Object.keys(compositions[substanceId])) {
							productIdsCurrentlyValidToApply.add(productId);
						}
					}
				}

				// If no products can be currently applied, skip the parcel and wait for all dates to expire
				if (productIdsCurrentlyValidToApply.size === 0) {
					continue;
				}
				// productIdsCurrentlyValidToApply contains only products already previously used by the user:
				// this means the app cannot propose new products to use as the disease become active,
				// since several products can be available for one disease and it is not for the app to choose
				const isProductsUsedInLastTreatmentAndValidToApply = (
					pa: (typeof lastTreatment.productApplications)[number],
				): pa is {
					product: { id: string; daysBetweenApplications: number };
					dose: number;
				} => {
					return (
						productIdsCurrentlyValidToApply.has(pa.product.id) &&
						pa.product.daysBetweenApplications !== null &&
						daysSinceLastTreatment >= pa.product.daysBetweenApplications
					);
				};

				const productsUsedInLastTreatmentAndValidToApply =
					lastTreatment.productApplications.filter(
						isProductsUsedInLastTreatmentAndValidToApply,
					);
				const minDaysBetweenApplications = Math.min(
					...productsUsedInLastTreatmentAndValidToApply.map(
						(el) => el.product.daysBetweenApplications,
					),
				);
				const suggestedDate = new Date(lastTreatment.appliedDate);
				suggestedDate.setDate(
					suggestedDate.getDate() + minDaysBetweenApplications,
				);
				const newDateMax = new Date(suggestedDate);
				newDateMax.setDate(newDateMax.getDate() + minDaysBetweenApplications);

				if (productsUsedInLastTreatmentAndValidToApply.length <= 0) {
					console.info("No products used in last treatment and valid to apply");
					continue;
				}

				await prisma.treatment.create({
					data: {
						parcelId: parcel.id,
						userId: user.id,
						status: TreatmentStatus.TODO,
						dateMin: suggestedDate,
						dateMax: newDateMax,
						waterDose: lastTreatment.waterDose || 10,
						diseaseIds: lastTreatment.diseaseIds,
						productApplications: {
							create: productsUsedInLastTreatmentAndValidToApply.map((el) => ({
								dose: el.dose,
								productId: el.product.id,
							})),
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
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
