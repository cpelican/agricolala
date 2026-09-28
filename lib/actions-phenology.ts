"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taintUtils } from "@/lib/taint-utils";
import { Errors } from "@/lib/constants";
import { recordPhenologyObservationSchema } from "./actions-schemas";
import { createStandaloneObservation } from "./phenology-observations";

// Stage observed without a treatment (the parcel card's "Update stage").
export async function recordPhenologyObservation(formData: FormData) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || !session.user.isAuthorized) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	taintUtils.taintUserSession(session.user);

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
