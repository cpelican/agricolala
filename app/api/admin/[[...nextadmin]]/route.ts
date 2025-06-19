import { createHandler } from "@premieroctet/next-admin/appHandler";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "../../../../lib/prisma";

const { run } = createHandler({
	apiBasePath: "/api/admin",
	prisma,
	onRequest: async () => {
		const session = await getServerSession(authOptions);
		const adminUser = await prisma.adminUser.findFirst({
			where: { email: session?.user?.email ?? "" },
		});
		if (adminUser == null) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
	},
});

export { run as DELETE, run as GET, run as POST };
