import "server-only";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { taintUtils } from "@/lib/taint-utils";
import { cache } from "react";

const getSession = cache(async () => {
	return await getServerSession(authOptions);
});

export async function requireAuth() {
	const session = await getSession();
	if (!session?.user?.email) {
		redirect("/auth/signin");
	}

	taintUtils.taintUserSession(session.user);

	return session;
}
