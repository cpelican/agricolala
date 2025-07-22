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
	// Verify this is a Vercel cron job
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		let suggestedTreatments = 0;
		const currentDate = new Date();

		// Delete all TODO treatments that are no longer valid
		// A TODO treatment is invalid when at least one of its products has reached its daysBetweenApplications
		await prisma.treatment.deleteMany({
			where: {
				status: TreatmentStatus.TODO,
				dateMax: {
					// less then: before
					lt: currentDate,
				},
			},
		});

		const users = await getAuthorizedUsersWithLastTreatmentsData();
		const compositions = await getCachedCompositions();

		// Process each user's parcels
		for (const user of users) {
			for (const parcel of user.parcels) {
				// Skip parcels without any treatments
				if (parcel.treatments.length === 0) continue;

				const lastTreatment = parcel.treatments[0];
				if (!lastTreatment.appliedDate) continue;

				// Calculate days since last treatment
				const daysSinceLastTreatment = Math.floor(
					(currentDate.getTime() - lastTreatment.appliedDate.getTime()) /
						(1000 * 60 * 60 * 24),
				);
				// Filter diseaseIds to only include currently sensitive diseases
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

				// Check if we already have TODO treatments for this parcel
				const existingTodos = await prisma.treatment.findMany({
					where: {
						parcelId: parcel.id,
						status: TreatmentStatus.TODO,
					},
					select: {
						id: true,
						dateMax: true,
						productApplications: {
							select: {
								product: {
									select: {
										id: true,
									},
								},
							},
						},
					},
				});

				// Delete any additional TODO treatments: we want a one to one type relationship with the parcel
				if (existingTodos.length > 1) {
					const additionalTodoIds = existingTodos
						.slice(1)
						.map((todo) => todo.id);
					await prisma.treatment.deleteMany({
						where: {
							id: {
								in: additionalTodoIds,
							},
						},
					});
				}

				/// OLD LOGIC ///
				// Check each product application from the last treatment
				for (const productApplication of lastTreatment.productApplications) {
					const product = productApplication.product;

					// Skip products without daysBetweenApplications
					if (!product.daysBetweenApplications) continue;

					// If the product is not due for application, skip it
					if (daysSinceLastTreatment < product.daysBetweenApplications) {
						continue;
					}

					// Calculate the suggested date for this product
					const suggestedDate = new Date(lastTreatment.appliedDate);
					suggestedDate.setDate(
						suggestedDate.getDate() + product.daysBetweenApplications,
					);

					if (existingTodos.length > 0) {
						// Use the first TODO treatment and delete any others to ensure only one per parcel
						const primaryTodo = existingTodos[0];

						// Update existing TODO treatment to include this product if not already present
						const hasProduct = primaryTodo.productApplications.some(
							(pa) => pa.product.id === product.id,
						);

						// Eventually if the disease is not longer active the treatment will be deleted
						if (
							!hasProduct &&
							productIdsCurrentlyValidToApply.has(product.id)
						) {
							await prisma.productApplication.create({
								data: {
									treatmentId: primaryTodo.id,
									productId: product.id,
									dose: productApplication.dose, // Use the same dose as last time. We trust the user will check the dose and update it
								},
							});

							// Update dateMax if the new product's next application date is earlier
							const newProductDateMax = new Date(suggestedDate);
							newProductDateMax.setDate(
								newProductDateMax.getDate() + product.daysBetweenApplications,
							);

							if (
								primaryTodo.dateMax &&
								newProductDateMax < primaryTodo.dateMax
							) {
								await prisma.treatment.update({
									where: { id: primaryTodo.id },
									data: { dateMax: newProductDateMax },
								});
							}
						}
					} else {
						if (
							filteredDiseaseIds.length > 0 &&
							productIdsCurrentlyValidToApply.has(product.id)
						) {
							// Create new TODO treatment with this product
							const newDateMax = new Date(suggestedDate);
							newDateMax.setDate(
								newDateMax.getDate() + product.daysBetweenApplications,
							);

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
										create: {
											productId: product.id,
											dose: productApplication.dose, // Use the same dose as last time
										},
									},
								},
							});

							suggestedTreatments++;
						}
					}
				}
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
