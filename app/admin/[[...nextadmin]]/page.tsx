import { NextAdmin } from "@premieroctet/next-admin/adapters/next";
import { getNextAdminProps } from "@premieroctet/next-admin/appRouter";
import nextAdminOptions from "@/nextAdminOptions";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { notFound } from "next/navigation";

export default async function AdminPage({
	params,
	searchParams,
}: {
	params: Promise<{ nextadmin: string[] }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const session = await requireAuth();
	if (!session.user.isAuthorized) {
		return notFound();
	}
	if (!session?.user?.email) {
		return notFound();
	}

	const adminUser = await prisma.adminUser.findFirst({
		where: { email: session.user.email },
	});

	if (!adminUser) {
		return notFound();
	}

	const props = await getNextAdminProps({
		params: (await params).nextadmin,
		searchParams: await searchParams,
		basePath: "/admin",
		apiBasePath: "/api/admin",
		prisma,
		options: nextAdminOptions,
	});
	return <NextAdmin {...props} />;
}
