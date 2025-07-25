import "server-only";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { taintUtils } from "@/lib/taint-utils";

export async function requireAuth() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email) {
		redirect("/auth/signin");
	}

	taintUtils.taintUserSession(session.user);

	return session;
}
