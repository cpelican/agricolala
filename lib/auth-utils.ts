import "server-only";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { taintUtils } from "@/lib/taint-utils";
import { cache } from "react";
import { Errors, INVALID_SESSION_ID } from "@/lib/constants";

const getSession = cache(async () => {
	return await getServerSession(authOptions);
});

export async function requireAuth() {
	const session = await getSession();

	// Middleware should have already redirected unauthenticated users
	if (!session?.user?.email || session.user.id === INVALID_SESSION_ID) {
		console.error(
			"Unauthorized: No session found. This should not happen if middleware is working correctly.",
		);
		throw new Error(Errors.UNAUTHORIZED);
	}

	taintUtils.taintUserSession(session.user);

	return session;
}
