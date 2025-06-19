import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email) {
		redirect("/auth/signin");
	}
	return session;
}
