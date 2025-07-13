import { TreatmentStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTreatmentSchema } from "./schema";
import { updateSubstanceAggregations } from "@/lib/update-substance-aggregations";

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validatedData = createTreatmentSchema.parse(body);

		const parcels = await prisma.parcel.findMany({
			where: {
				id: { in: validatedData.parcelIds },
				userId: session.user.id,
			},
			select: {
				id: true,
				name: true,
				width: true,
				height: true,
			},
		});

		if (parcels.length !== validatedData.parcelIds.length) {
			return NextResponse.json(
				{ error: "One or more parcels not found or access denied" },
				{ status: 403 },
			);
		}

		const totalArea = parcels.reduce(
			(sum, parcel) => sum + parcel.width * parcel.height,
			0,
		);

		const calculateDosePerParcel = (totalDose: number, parcelArea: number) => {
			return (totalDose * parcelArea) / totalArea;
		};

		const createdTreatments = await Promise.all(
			parcels.map(async (parcel) => {
				const treatment = await prisma.treatment.create({
					data: {
						waterDose: validatedData.waterDose,
						parcelId: parcel.id,
						appliedDate: validatedData.appliedDate || new Date(),
						status: TreatmentStatus.DONE,
						userId: session.user.id,
						diseaseIds: validatedData.diseases.map(
							(disease) => disease.diseaseId,
						),
					},
				});

				const productApplications = await Promise.all(
					validatedData.productApplications.map(async (product) => {
						const parcelArea = parcel.width * parcel.height;
						const calculatedDose = calculateDosePerParcel(
							product.dose,
							parcelArea,
						);

						return prisma.productApplication.create({
							data: {
								dose: calculatedDose,
								productId: product.productId,
								treatmentId: treatment.id,
							},
						});
					}),
				);

				return {
					treatment,
					productApplications,
				};
			}),
		);

		const currentYear = new Date().getFullYear();
		await updateSubstanceAggregations(session.user.id, currentYear);

		return NextResponse.json({
			success: true,
			treatments: createdTreatments.map((t) => t.treatment.id),
			message: `Created ${createdTreatments.length} treatments across ${parcels.length} parcels`,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "ZodError") {
			return NextResponse.json(
				{
					error: "Invalid input data",
					details: error instanceof Error ? error.message : "Validation failed",
				},
				{ status: 400 },
			);
		}

		console.error("Error creating treatment:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
