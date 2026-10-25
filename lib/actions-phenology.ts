"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/constants";
import { recordPhenologyObservationSchema } from "./actions-schemas";
import { createStandaloneObservation } from "./phenology-observations";

// Stage observed without a treatment (the parcel card's "Update stage").
export async function recordPhenologyObservation(formData: FormData) {
	const session = await getAuthorizedSession();
	if (!session) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	try {
		const observedAt = formData.get("observedAt");
		const validatedData = recordPhenologyObservationSchema.parse({
			parcelId: String(formData.get("parcelId")),
			stage: String(formData.get("stage")),
			observedAt: observedAt ? new Date(String(observedAt)) : new Date(),
		});

		const observation = await createStandaloneObservation(prisma, {
			userId: session.user.id,
			...validatedData,
		});

		revalidatePath("/parcels");
		revalidatePath("/");

		return {
			success: true,
			observation,
		};
	} catch (error) {
		console.error("Error recording phenology observation", error);
		throw new Error(Errors.INTERNAL_SERVER);
	}
}
