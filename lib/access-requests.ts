import "server-only";
import { prisma } from "./prisma";
import { type Locale } from "./translations-helpers";

const RECENTLY_APPROVED_COUNT = 20;

// Admins are the emails listed in AdminUser (`npm run create-admin-user <email>`).
export async function isAdminEmail(email: string | null | undefined) {
	if (!email) {
		return false;
	}
	const admin = await prisma.adminUser.findUnique({
		where: { email },
		select: { id: true },
	});
	return admin !== null;
}

export async function getAccessRequestOf(userId: string) {
	return await prisma.accessRequest.findUnique({
		where: { userId },
		select: { createdAt: true },
	});
}

const reviewSelect = {
	id: true,
	message: true,
	createdAt: true,
	reviewedAt: true,
	user: {
		select: { id: true, name: true, email: true, locale: true },
	},
} as const;

export async function getAccessRequestsForReview() {
	const [pending, approved] = await Promise.all([
		prisma.accessRequest.findMany({
			where: { reviewedAt: null },
			orderBy: { createdAt: "asc" },
			select: reviewSelect,
		}),
		prisma.accessRequest.findMany({
			where: { reviewedAt: { not: null } },
			orderBy: { reviewedAt: "desc" },
			take: RECENTLY_APPROVED_COUNT,
			select: reviewSelect,
		}),
	]);
	return { pending, approved };
}

// Fixed time zone so the server and the browser print the same day.
export const formatAccessRequestDate = (date: Date, locale: Locale) =>
	new Intl.DateTimeFormat(locale, {
		dateStyle: "long",
		timeZone: "Europe/Rome",
	}).format(date);
