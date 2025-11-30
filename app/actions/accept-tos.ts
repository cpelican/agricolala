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

		await prisma.user.update({
			where: { email: session.user.email },
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
