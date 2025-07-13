import { createHandler } from "@premieroctet/next-admin/appHandler";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "../../../../lib/prisma";
import { taintUtils } from "@/lib/taint-utils";

const { run } = createHandler({
	apiBasePath: "/api/admin",
	prisma,
	onRequest: async () => {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		taintUtils.taintObject(
			"Do not pass admin session data to the client.",
			session,
		);

		const adminUser = await prisma.adminUser.findFirst({
			where: { email: session.user.email },
		});

		if (!adminUser) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		taintUtils.taintObject(
			"Do not pass admin user data to the client.",
			adminUser,
		);
	},
});

export { run as DELETE, run as GET, run as POST };
