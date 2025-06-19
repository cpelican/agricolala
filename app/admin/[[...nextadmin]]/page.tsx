import { NextAdmin } from "@premieroctet/next-admin/adapters/next";
import { getNextAdminProps } from "@premieroctet/next-admin/appRouter";
import nextAdminOptions from "@/nextAdminOptions";
import { prisma } from "../../../lib/prisma";

export default async function AdminPage({
	params,
	searchParams,
}: {
	params: Promise<{ nextadmin: string[] }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
