import { authOptions } from "@/lib/auth";
import { prisma } from "../../../../lib/prisma";
import { createHandler } from "@premieroctet/next-admin/appHandler";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const { run } = createHandler({
	apiBasePath: "/api/admin",
	prisma,
	onRequest: async () => {
		const session = await getServerSession(authOptions);
		const adminUser = await prisma.user.findFirst({
			where: { email: session?.user?.email ?? "", isAdmin: true },
		});
		if (adminUser == null) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
	},
});

export { run as DELETE, run as GET, run as POST };
