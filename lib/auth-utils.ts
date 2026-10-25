import "server-only";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { taintUtils } from "@/lib/taint-utils";
import { cache } from "react";
import { INVALID_SESSION_ID } from "@/lib/constants";

const getSession = cache(async () => {
	return await getServerSession(authOptions);
});

export async function requireAuth() {
	const session = await getSession();

	// Middleware should redirect unauthenticated users; invalid sessions land here.
	if (!session?.user?.email || session.user.id === INVALID_SESSION_ID) {
		console.error(
			"Unauthorized: No valid session found. Redirecting to sign-in.",
		);
		redirect("/auth/signin");
	}

	taintUtils.taintUserSession(session.user);

	return session;
}

/**
 * For server actions: returns the session of an approved user, or null.
 * Unlike `requireAuth`, it never redirects, so each action picks its own error.
 */
export async function getAuthorizedSession() {
	const session = await getSession();

	if (
		!session?.user?.id ||
		session.user.id === INVALID_SESSION_ID ||
		!session.user.isAuthorized
	) {
		return null;
	}

	taintUtils.taintUserSession(session.user);

	return session;
}
