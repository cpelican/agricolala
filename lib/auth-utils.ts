import "server-only";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { taintUtils } from "@/lib/taint-utils";
import { cache } from "react";

const getSession = cache(async () => {
	return await getServerSession(authOptions);
});

export async function requireAuth() {
	const session = await getSession();

	// Middleware should have already redirected unauthenticated users
	if (!session?.user?.email) {
		throw new Error(
			"Unauthorized: No session found. This should not happen if middleware is working correctly.",
		);
	}

	taintUtils.taintUserSession(session.user);

	return session;
}
