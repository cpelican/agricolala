"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSubstanceAggregations } from "@/lib/update-substance-aggregations";
import { TreatmentStatus } from "@prisma/client";
import { createTreatmentSchema, createParcelSchema } from "./actions-schemas";

// Treatment Actions
export async function createTreatment(formData: FormData) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		throw new Error("Authentication required");
	}

	try {
		// Parse form data
		const appliedDate = formData.get("appliedDate") as string;
		const parcelIds = formData.getAll("parcelIds") as string[];
		const diseases = JSON.parse(formData.get("diseases") as string);
		const productApplications = JSON.parse(
			formData.get("productApplications") as string,
		);
		const waterDose = parseFloat(formData.get("waterDose") as string);

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
			throw new Error("One or more parcels not found or access denied");
		}

		// Calculate total area
		const totalArea = parcels.reduce(
			(sum, parcel) => sum + parcel.width * parcel.height,
			0,
		);

		const calculateDosePerParcel = (totalDose: number, parcelArea: number) => {
			return (totalDose * parcelArea) / totalArea;
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
		console.error("Error creating treatment:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to create treatment",
		);
	}
}

export async function deleteTreatment(treatmentId: string) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		throw new Error("Authentication required");
	}

	try {
		// Verify treatment exists and belongs to user
		const treatment = await prisma.treatment.findFirst({
			where: {
				id: treatmentId,
				userId: session.user.id,
			},
		});

		if (!treatment) {
			throw new Error("Treatment not found or access denied");
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
		console.error("Error deleting treatment:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to delete treatment",
		);
	}
}

// Parcel Actions
export async function createParcel(formData: FormData) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		throw new Error("Authentication required");
	}

	try {
		// Parse form data
		const name = formData.get("name") as string;
		const width = parseFloat(formData.get("width") as string);
		const height = parseFloat(formData.get("height") as string);
		const type = formData.get("type") as string;
		const latitude = parseFloat(formData.get("latitude") as string);
		const longitude = parseFloat(formData.get("longitude") as string);

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
		console.error("Error creating parcel:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to create parcel",
		);
	}
}

export async function deleteParcel(parcelId: string) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		throw new Error("Authentication required");
	}

	try {
		// Verify parcel exists and belongs to user
		const parcel = await prisma.parcel.findFirst({
			where: {
				id: parcelId,
				userId: session.user.id,
			},
		});

		if (!parcel) {
			throw new Error("Parcel not found or access denied");
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
		console.error("Error deleting parcel:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to delete parcel",
		);
	}
}
