"use server";

import { prisma } from "@/lib/prisma";
import { getAuthorizedSession } from "@/lib/auth-utils";
import { Errors } from "@/lib/constants";

export async function acceptTos() {
	const session = await getAuthorizedSession();
	if (!session) {
		return { success: false, error: Errors.UNAUTHORIZED };
	}

	try {
		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				tosAcceptedAt: new Date(),
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error accepting ToS", error);
		return { success: false, error: Errors.INTERNAL_SERVER };
	}
}

export async function getTosStatus() {
	const session = await getAuthorizedSession();
	if (!session) {
		return { success: false, error: Errors.UNAUTHORIZED };
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { tosAcceptedAt: true },
		});

		if (!user) {
			return { success: false, error: Errors.RESOURCE_NOT_FOUND };
		}

		return {
			success: true,
			tosAccepted: !!user.tosAcceptedAt,
			tosAcceptedAt: user.tosAcceptedAt,
		};
	} catch (error) {
		console.error("Error getting ToS status", error);

		return { success: false, error: Errors.INTERNAL_SERVER };
	}
}
