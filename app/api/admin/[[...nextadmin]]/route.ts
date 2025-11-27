import { createHandler } from "@premieroctet/next-admin/appHandler";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "../../../../lib/prisma";
import { taintUtils } from "@/lib/taint-utils";
import { Errors } from "@/app/const";

const { run } = createHandler({
	apiBasePath: "/api/admin",
	prisma,
	onRequest: async () => {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 401 });
		}

		taintUtils.taintObject(
			"Do not pass admin session data to the client.",
			session,
		);

		const adminUser = await prisma.adminUser.findFirst({
			where: { email: session.user.email },
		});

		if (!adminUser) {
			return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 403 });
		}

		taintUtils.taintObject(
			"Do not pass admin user data to the client.",
			adminUser,
		);
	},
});

// Wrapper functions to match Next.js 16 async params signature
// Note: @premieroctet/next-admin may need updates for Next.js 16 compatibility
const handleRequest = async (
	request: NextRequest,
	context: { params: Promise<{ nextadmin?: string[] }> },
) => {
	const params = await context.params;
	// Convert NextRequest to Request for library compatibility
	const legacyRequest = new Request(request.url, {
		method: request.method,
		headers: request.headers,
		body: request.body,
	});
	// Ensure nextadmin is always an array (not undefined)
	const normalizedParams = { nextadmin: params.nextadmin ?? [] };
	// Type assertion needed due to library compatibility with Next.js 16
	return run(legacyRequest, {
		params: Promise.resolve(normalizedParams),
	} as Parameters<typeof run>[1]);
};

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ nextadmin?: string[] }> },
) {
	return handleRequest(request, context);
}

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ nextadmin?: string[] }> },
) {
	return handleRequest(request, context);
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ nextadmin?: string[] }> },
) {
	return handleRequest(request, context);
}
