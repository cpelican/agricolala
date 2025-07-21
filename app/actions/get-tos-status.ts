"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Errors } from "@/app/const";

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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_error) {
		console.error("Error getting ToS status");

		return { success: false, error: Errors.INTERNAL_SERVER };
	}
}
