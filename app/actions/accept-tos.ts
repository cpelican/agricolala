"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Errors } from "../const";

export async function acceptTos() {
	try {
		const session = await requireAuth();

		if (!session?.user?.email || !session.user.isAuthorized) {
			return { success: false, error: Errors.UNAUTHORIZED };
		}

		// Update the user's ToS acceptance
		await prisma.user.update({
			where: { email: session.user.email },
			data: {
				tosAcceptedAt: new Date(),
			},
		});

		return { success: true };
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_error) {
		console.error("Error accepting ToS");
		return { success: false, error: Errors.INTERNAL_SERVER };
	}
}
