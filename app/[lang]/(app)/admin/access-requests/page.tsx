import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/misc/header";
import { PendingAccessRequests } from "@/components/admin/pending-access-requests";
import { SUBSECTION_TITLE } from "@/components/ui/typography";
import {
	formatAccessRequestDate,
	getAccessRequestsForReview,
	isAdminEmail,
} from "@/lib/access-requests";
import { requireAuth } from "@/lib/auth-utils";
import { getLanguageAsLocale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default async function AccessRequestsPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const locale = getLanguageAsLocale(lang);
	const session = await requireAuth();
	// Same answer as a page that doesn't exist, so non-admins can't tell it's here.
	if (!(await isAdminEmail(session.user.email))) {
		notFound();
	}

	const t = tServer(locale).auth.admin;
	const { pending, approved } = await getAccessRequestsForReview();

	return (
		<>
			<Header title={t.title} />
			<div className="flex flex-col gap-8 px-4 pb-8">
				<PendingAccessRequests
					t={t}
					requests={pending.map((request) => ({
						userId: request.user.id,
						name: request.user.name,
						email: request.user.email,
						locale: request.user.locale,
						message: request.message,
						requestedOn: formatAccessRequestDate(request.createdAt, locale),
					}))}
				/>

				<section
					aria-labelledby="approved-requests"
					className="flex flex-col gap-3"
				>
					<h2 id="approved-requests" className={SUBSECTION_TITLE}>
						{t.approvedTitle}
					</h2>
					{approved.length === 0 ? (
						<p className="m-0 text-base text-neutral-700">{t.approvedEmpty}</p>
					) : (
						<ul className="m-0 flex list-none flex-col gap-2 p-0">
							{approved.map((request) => (
								<li
									key={request.id}
									className="rounded-lg border border-neutral-200 bg-white p-4"
								>
									<p className="m-0 font-medium text-neutral-950">
										{request.user.name ?? t.noName}{" "}
										<span className="font-normal text-neutral-700">
											{request.user.email}
										</span>
									</p>
									{request.reviewedAt && (
										<p className="m-0 text-sm text-neutral-700">
											{t.approvedOn.replace(
												"{date}",
												formatAccessRequestDate(request.reviewedAt, locale),
											)}
										</p>
									)}
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</>
	);
}
