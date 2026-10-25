"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { type Locale } from "./i18n/locale";
import { updateSubstanceAggregations } from "@/lib/update-substance-aggregations/core";
import { TreatmentStatus } from "@prisma/client";
import { productApplicationsToGrams } from "./product-dose-to-grams";
import { getProductDoseUnits } from "./data-fetcher-catalog";
import { createTreatmentSchema, createParcelSchema } from "./actions-schemas";
import { createObservationsForParcels } from "./phenology-observations";
import {
	computeParcelAreaM2,
	computeParcelCentroid,
	parcelBoundaryToJson,
	validateBoundary,
	getParcelAreaM2,
} from "./parcel-geometry";
import { taintUtils } from "@/lib/taint-utils";
import { Errors, isAccessError } from "@/lib/constants";
import { parcelAccessWhere, treatmentAccessWhere } from "./parcel-access";

export async function createTreatment(formData: FormData) {
	const session = await getAuthorizedSession();
	if (!session) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	try {
		const appliedDate = String(formData.get("appliedDate"));
		const parcelIds = formData.getAll("parcelIds").map(String);
		const diseases = JSON.parse(String(formData.get("diseases")));
		const productApplications = JSON.parse(
			String(formData.get("productApplications")),
		);
		const waterDose = parseFloat(String(formData.get("waterDose")));
		const phenologicalStage = formData.get("phenologicalStage");

		const validatedData = createTreatmentSchema.parse({
			appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
			parcelIds,
			diseases,
			productApplications,
			waterDose,
			phenologicalStage: phenologicalStage
				? String(phenologicalStage)
				: undefined,
		});

		const parcels = await prisma.parcel.findMany({
			where: {
				id: { in: validatedData.parcelIds },
				...parcelAccessWhere(session.user.id),
			},
			select: {
				id: true,
				name: true,
				width: true,
				height: true,
				areaM2: true,
			},
		});

		if (parcels.length !== validatedData.parcelIds.length) {
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}

		const productApplicationsInGrams = productApplicationsToGrams(
			validatedData.productApplications,
			await getProductDoseUnits(
				validatedData.productApplications.map((p) => p.productId),
			),
		);

		const totalArea = parcels.reduce(
			(sum, parcel) => sum + getParcelAreaM2(parcel),
			0,
		);

		const diseaseIds = validatedData.diseases.map(
			(disease) => disease.diseaseId,
		);

		const calculateDosePerParcel = (totalDose: number, parcelArea: number) => {
			const result = (totalDose * parcelArea) / totalArea;

			taintUtils.taintBusinessLogic({ result });

			return result;
		};

		const parcelAreaById = new Map(
			parcels.map((parcel) => [parcel.id, getParcelAreaM2(parcel)]),
		);

		const createdTreatments = await prisma.$transaction(async (tx) => {
			const treatments = await tx.treatment.createManyAndReturn({
				data: parcels.map((parcel) => ({
					waterDose: validatedData.waterDose,
					parcelId: parcel.id,
					appliedDate: validatedData.appliedDate,
					status: TreatmentStatus.DONE,
					userId: session.user.id,
					diseaseIds,
				})),
				select: { id: true, parcelId: true },
			});

			await tx.productApplication.createMany({
				data: treatments.flatMap((treatment) => {
					const parcelArea = parcelAreaById.get(treatment.parcelId) ?? 0;
					return productApplicationsInGrams.map((product) => ({
						dose: calculateDosePerParcel(product.doseInGrams, parcelArea),
						productId: product.productId,
						treatmentId: treatment.id,
					}));
				}),
			});

			if (validatedData.phenologicalStage) {
				await createObservationsForParcels(tx, {
					parcelIds: parcels.map((parcel) => parcel.id),
					stage: validatedData.phenologicalStage,
					observedAt: validatedData.appliedDate,
				});
			}

			return treatments;
		});

		await updateSubstanceAggregations(prisma, {
			parcelIds: parcels.map((parcel) => parcel.id),
		});

		revalidatePath("/treatments");
		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			treatments: createdTreatments.map((t) => t.id),
			message: `Created ${createdTreatments.length} treatments across ${parcels.length} parcels`,
		};
	} catch (error) {
		console.error("Error creating treatment", error);
		if (isAccessError(error)) {
			throw error;
		}
		throw new Error(Errors.INTERNAL_SERVER);
	}
}

export async function deleteTreatment(treatmentId: string) {
	const session = await getAuthorizedSession();
	if (!session) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	try {
		// Only its author deletes a treatment, even on a shared parcel (D2).
		const treatment = await prisma.treatment.findFirst({
			where: {
				id: treatmentId,
				userId: session.user.id,
				...treatmentAccessWhere(session.user.id),
			},
		});

		if (!treatment) {
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}

		await prisma.treatment.delete({
			where: {
				id: treatmentId,
			},
		});

		await updateSubstanceAggregations(prisma, {
			parcelIds: [treatment.parcelId],
		});

		revalidatePath("/treatments");
		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			message: "Treatment deleted successfully",
		};
	} catch (error) {
		console.error("Error deleting treatment", error);
		if (isAccessError(error)) {
			throw error;
		}
		throw new Error(Errors.INTERNAL_SERVER);
	}
}

export async function createParcel(formData: FormData) {
	const session = await getAuthorizedSession();
	if (!session) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	try {
		const name = String(formData.get("name"));
		const type = String(formData.get("type"));
		const boundaryRaw = String(formData.get("boundary"));
		const altitudeRaw = formData.get("altitude");
		const boundary = JSON.parse(boundaryRaw);

		const validatedData = createParcelSchema.parse({
			name,
			type,
			boundary,
			altitude:
				altitudeRaw != null && String(altitudeRaw).length > 0
					? parseFloat(String(altitudeRaw))
					: undefined,
		});

		validateBoundary(validatedData.boundary);
		const areaM2 = computeParcelAreaM2(validatedData.boundary);
		const { lat: latitude, lng: longitude } = computeParcelCentroid(
			validatedData.boundary,
		);

		const parcel = await prisma.parcel.create({
			data: {
				name: validatedData.name,
				type: validatedData.type,
				latitude,
				longitude,
				altitude: validatedData.altitude,
				boundary: parcelBoundaryToJson(validatedData.boundary),
				areaM2,
				width: 0,
				height: 0,
				userId: session.user.id,
				members: { create: { userId: session.user.id } },
			},
		});

		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			parcel,
		};
	} catch (error) {
		console.error("Error creating parcel", error);
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2003"
		) {
			throw new Error(Errors.ACCESS_DENIED);
		}
		throw new Error(Errors.INTERNAL_SERVER);
	}
}

export async function deleteParcel(parcelId: string) {
	const session = await getAuthorizedSession();
	if (!session) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	try {
		const parcel = await prisma.parcel.findFirst({
			where: {
				id: parcelId,
				...parcelAccessWhere(session.user.id),
			},
			select: { userId: true, members: { select: { userId: true } } },
		});

		if (!parcel) {
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}
		// Other members see the parcel but only its creator deletes it (D3).
		if (parcel.userId !== session.user.id) {
			throw new Error(Errors.ACCESS_DENIED);
		}

		await prisma.parcel.delete({
			where: {
				id: parcelId,
			},
		});

		// Memberships are gone with the parcel: refresh its former members' totals.
		await updateSubstanceAggregations(prisma, {
			parcelIds: [parcelId],
			userIds: parcel.members.map((member) => member.userId),
		});

		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			message: "Parcel deleted successfully",
		};
	} catch (error) {
		console.error("Error deleting parcel", error);
		if (isAccessError(error)) {
			throw error;
		}
		throw new Error(Errors.INTERNAL_SERVER);
	}
}

export async function updateUserLocale(locale: Locale) {
	const session = await getAuthorizedSession();
	if (!session) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	try {
		await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				locale,
			},
		});

		revalidatePath("/");
		revalidatePath("/profile");

		return {
			success: true,
			message: "Locale updated successfully",
		};
	} catch (error) {
		console.error("Error updating user locale", error);
		throw new Error(Errors.INTERNAL_SERVER);
	}
}
