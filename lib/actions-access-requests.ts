"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INVALID_SESSION_ID } from "@/lib/constants";
import {
	accessRequestErrors,
	accessRequestSchema,
	approveAccessRequestSchema,
} from "./access-request-schemas";
import { formatAccessRequestDate, isAdminEmail } from "./access-requests";
import { notifyAdminOfAccessRequest, sendAccessGrantedEmail } from "./email";
import { getLanguageAsLocale } from "./translations-helpers";

export type AccessRequestState =
	| { status: "idle" }
	| { status: "sent"; sentOn: string }
	| { status: "error"; error: "tooShort" | "tooLong" | "generic" };

export type ApproveAccessRequestState =
	| { status: "idle" }
	| { status: "approved"; name: string; emailSent: boolean }
	| { status: "error" };

const fieldError = (code: string | undefined) =>
	code === accessRequestErrors.tooShort || code === accessRequestErrors.tooLong
		? code
		: "generic";

// Sent from the waiting screen. The account comes from the session only, never from
// the form, and an account gets one request (and so one email to me), however often
// the form is posted.
export async function requestAccess(
	_previous: AccessRequestState,
	formData: FormData,
): Promise<AccessRequestState> {
	const session = await getServerSession(authOptions);
	const userId = session?.user?.id;
	if (!userId || userId === INVALID_SESSION_ID || session.user.isAuthorized) {
		return { status: "error", error: "generic" };
	}

	const parsed = accessRequestSchema.safeParse({
		message: formData.get("message"),
		locale: formData.get("locale"),
	});
	if (!parsed.success) {
		return {
			status: "error",
			error: fieldError(parsed.error.issues[0]?.message),
		};
	}
	const { message, locale } = parsed.data;

	try {
		const { created, request } = await prisma.$transaction(async (tx) => {
			const { count } = await tx.accessRequest.createMany({
				data: [{ userId, message }],
				skipDuplicates: true,
			});
			if (count > 0) {
				// The language they wrote in: the "you're in" email uses it.
				await tx.user.update({ where: { id: userId }, data: { locale } });
			}
			const request = await tx.accessRequest.findUniqueOrThrow({
				where: { userId },
				select: {
					createdAt: true,
					message: true,
					user: { select: { name: true, email: true, locale: true } },
				},
			});
			return { created: count > 0, request };
		});

		if (created) {
			// Never throws: a failed email still leaves the request saved.
			await notifyAdminOfAccessRequest({
				name: request.user.name,
				email: request.user.email,
				locale: request.user.locale,
				message: request.message,
				requestedAt: request.createdAt,
			});
			revalidatePath("/[lang]/admin/access-requests", "page");
		}

		return {
			status: "sent",
			sentOn: formatAccessRequestDate(request.createdAt, locale),
		};
	} catch (error) {
		console.error("Error saving access request", error);
		return { status: "error", error: "generic" };
	}
}

// One click on the admin page: opens the account, erases the introduction, then
// tells its owner.
export async function approveAccessRequest(
	_previous: ApproveAccessRequestState,
	formData: FormData,
): Promise<ApproveAccessRequestState> {
	const session = await getServerSession(authOptions);
	if (!(await isAdminEmail(session?.user?.email))) {
		return { status: "error" };
	}

	const parsed = approveAccessRequestSchema.safeParse({
		userId: formData.get("userId"),
	});
	if (!parsed.success) {
		return { status: "error" };
	}
	const { userId } = parsed.data;

	try {
		const user = await prisma.$transaction(async (tx) => {
			await tx.accessRequest.update({
				where: { userId },
				// The introduction was only needed to decide: it's erased once the account
				// opens, as the waiting screen promises. The row stays as a record that
				// the account asked and when it was approved.
				data: { reviewedAt: new Date(), message: "" },
			});
			return await tx.user.update({
				where: { id: userId },
				data: { isAuthorized: true },
				select: { name: true, email: true, locale: true },
			});
		});

		const emailResult = await sendAccessGrantedEmail({
			email: user.email,
			name: user.name,
			locale: getLanguageAsLocale(user.locale),
		});

		revalidatePath("/[lang]/admin/access-requests", "page");

		return {
			status: "approved",
			name: user.name ?? user.email,
			emailSent: emailResult === "sent",
		};
	} catch (error) {
		console.error("Error approving access request", error);
		return { status: "error" };
	}
}
