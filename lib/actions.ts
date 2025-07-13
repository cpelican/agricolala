"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSubstanceAggregations } from "@/lib/update-substance-aggregations";
import { TreatmentStatus } from "@prisma/client";
import { createTreatmentSchema, createParcelSchema } from "./actions-schemas";
import { taintUtils } from "@/lib/taint-utils";
import { generateTreatmentsExcel } from "./excel-export";
import { Errors } from "@/app/const";

export async function downloadTreatmentsExcel(year: number) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		throw new Error("Access denied");
	}

	taintUtils.taintUserSession(session.user);

	try {
		const excelBuffer = await generateTreatmentsExcel(session.user.id, year);

		// Return the Excel file as a base64 string for client-side download
		const base64Data = excelBuffer.toString("base64");

		return {
			success: true,
			data: base64Data,
			filename: `treatments-${year}-${session.user.email}.xlsx`,
		};
	} catch {
		console.error("Error generating Excel file");
		throw new Error(Errors.INTERNAL_SERVER);
	}
}

// Treatment Actions
export async function createTreatment(formData: FormData) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || !session.user.isAuthorized) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	taintUtils.taintUserSession(session.user);

	try {
		// Parse form data
		const appliedDate = String(formData.get("appliedDate"));
		const parcelIds = formData.getAll("parcelIds").map(String);
		const diseases = JSON.parse(String(formData.get("diseases")));
		const productApplications = JSON.parse(
			String(formData.get("productApplications")),
		);
		const waterDose = parseFloat(String(formData.get("waterDose")));

		// Validate with Zod
		const validatedData = createTreatmentSchema.parse({
			appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
			parcelIds,
			diseases,
			productApplications,
			waterDose,
		});

		// Verify parcels belong to user
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
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}

		// Calculate total area
		const totalArea = parcels.reduce(
			(sum, parcel) => sum + parcel.width * parcel.height,
			0,
		);

		const calculateDosePerParcel = (totalDose: number, parcelArea: number) => {
			const result = (totalDose * parcelArea) / totalArea;

			taintUtils.taintBusinessLogic({ result });

			return result;
		};

		// Create treatments
		const createdTreatments = await Promise.all(
			parcels.map(async (parcel) => {
				const treatment = await prisma.treatment.create({
					data: {
						waterDose: validatedData.waterDose,
						parcelId: parcel.id,
						appliedDate: validatedData.appliedDate,
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

		// Update aggregations
		const currentYear = new Date().getFullYear();
		await updateSubstanceAggregations(session.user.id, currentYear);

		// Revalidate pages
		revalidatePath("/treatments");
		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			treatments: createdTreatments.map((t) => t.treatment.id),
			message: `Created ${createdTreatments.length} treatments across ${parcels.length} parcels`,
		};
	} catch (error) {
		console.error("Error creating treatment");
		throw new Error(
			error instanceof Error ? error.message : Errors.INTERNAL_SERVER,
		);
	}
}

export async function deleteTreatment(treatmentId: string) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || !session.user.isAuthorized) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	taintUtils.taintUserSession(session.user);

	try {
		// Verify treatment exists and belongs to user
		const treatment = await prisma.treatment.findFirst({
			where: {
				id: treatmentId,
				userId: session.user.id,
			},
		});

		if (!treatment) {
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}

		// Delete treatment (cascades to product applications)
		await prisma.treatment.delete({
			where: {
				id: treatmentId,
			},
		});

		// Update aggregations
		const currentYear = new Date().getFullYear();
		await updateSubstanceAggregations(session.user.id, currentYear);

		// Revalidate pages
		revalidatePath("/treatments");
		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			message: "Treatment deleted successfully",
		};
	} catch (error) {
		console.error("Error deleting treatment");
		throw new Error(
			error instanceof Error ? error.message : Errors.INTERNAL_SERVER,
		);
	}
}

// Parcel Actions
export async function createParcel(formData: FormData) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || !session.user.isAuthorized) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	taintUtils.taintUserSession(session.user);

	try {
		const name = String(formData.get("name"));
		const width = parseFloat(String(formData.get("width")));
		const height = parseFloat(String(formData.get("height")));
		const type = String(formData.get("type"));
		const latitude = parseFloat(String(formData.get("latitude")));
		const longitude = parseFloat(String(formData.get("longitude")));

		// Validate with Zod
		const validatedData = createParcelSchema.parse({
			name,
			width,
			height,
			type,
			latitude,
			longitude,
		});

		// Create parcel
		const parcel = await prisma.parcel.create({
			data: {
				...validatedData,
				userId: session.user.id,
			},
		});

		// Revalidate pages
		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			parcel,
		};
	} catch (error) {
		console.error("Error creating parcel");
		throw new Error(
			error instanceof Error ? error.message : Errors.INTERNAL_SERVER,
		);
	}
}

export async function deleteParcel(parcelId: string) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || !session.user.isAuthorized) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	taintUtils.taintUserSession(session.user);

	try {
		// Verify parcel exists and belongs to user
		const parcel = await prisma.parcel.findFirst({
			where: {
				id: parcelId,
				userId: session.user.id,
			},
		});

		if (!parcel) {
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}

		// Delete parcel (cascades to treatments)
		await prisma.parcel.delete({
			where: {
				id: parcelId,
			},
		});

		// Update aggregations
		const currentYear = new Date().getFullYear();
		await updateSubstanceAggregations(session.user.id, currentYear);

		// Revalidate pages
		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			message: "Parcel deleted successfully",
		};
	} catch (error) {
		console.error("Error deleting parcel");
		throw new Error(
			error instanceof Error ? error.message : Errors.INTERNAL_SERVER,
		);
	}
}
