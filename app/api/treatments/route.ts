import { type TreatmentStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
	type CreateTreatmentAutomaticValuesSchema,
	type CreateTreatmentSchema,
} from "./schema";

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body: CreateTreatmentSchema & CreateTreatmentAutomaticValuesSchema =
			await request.json();
		const treatment = await prisma.treatment.create({
			data: {
				waterDose: body.waterDose,
				parcelId: body.parcelId,
				appliedDate: body.appliedDate || new Date(), // todo: give the possibility to a add a date
				status: TreatmentStatus.DONE,
				userId: session.user.id,
				diseaseIds: body.diseases.map((disease) => disease.diseaseId),
			},
		});
		await prisma.productApplication.createMany({
			data: body.productApplications.map((product) => ({
				dose: product.dose || 0,
				productId: product.productId,
				treatmentId: treatment.id,
			})),
		});
		return NextResponse.json({ success: true, treatmentId: treatment.id });
	} catch (error) {
		console.error("Error creating parcel:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
