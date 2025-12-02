"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Errors } from "@/lib/constants";

export async function getTosStatus() {
	try {
		const session = await requireAuth();

		if (!session?.user?.email || !session.user.isAuthorized) {
			return { success: false, error: Errors.UNAUTHORIZED };
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			select: { tosAcceptedAt: true },
		});

		if (!user) {
			return { success: false, error: Errors.RESOURCE_NOT_FOUND };
		}

		return {
			success: true,
			tosAccepted: !!user?.tosAcceptedAt,
			tosAcceptedAt: user?.tosAcceptedAt,
		};
	} catch (error) {
		console.error("Error getting ToS status", error);

		return { success: false, error: Errors.INTERNAL_SERVER };
	}
}
