import { TreatmentStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTreatmentSchema } from "./schema";

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validatedData = createTreatmentSchema.parse(body);
		const parcel = await prisma.parcel.findFirst({
			where: {
				id: validatedData.parcelId,
				userId: session.user.id,
			},
		});

		if (!parcel) {
			return NextResponse.json(
				{ error: "Parcel not found or access denied" },
				{ status: 403 },
			);
		}

		const treatment = await prisma.treatment.create({
			data: {
				waterDose: validatedData.waterDose,
				parcelId: validatedData.parcelId,
				appliedDate: validatedData.appliedDate || new Date(),
				status: TreatmentStatus.DONE,
				userId: session.user.id,
				diseaseIds: validatedData.diseases.map((disease) => disease.diseaseId),
			},
		});

		await prisma.productApplication.createMany({
			data: validatedData.productApplications.map((product) => ({
				dose: product.dose || 0,
				productId: product.productId,
				treatmentId: treatment.id,
			})),
		});

		return NextResponse.json({ success: true, treatmentId: treatment.id });
	} catch (error) {
		if (error instanceof Error && error.name === "ZodError") {
			return NextResponse.json(
				{ error: "Invalid input data" },
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
