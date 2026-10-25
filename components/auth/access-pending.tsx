import Image from "next/image";
import { AccessRequestForm } from "@/components/auth/access-request-form";
import { SignOutButton } from "@/components/auth/signout-button";
import { formatAccessRequestDate } from "@/lib/access-requests";
import { getAccessRequestOf } from "@/lib/data-fetcher-access-requests";
import type { Locale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

// Shown instead of the app while an account waits to be opened by hand.
export async function AccessPending({
	locale,
	userId,
	email,
}: {
	locale: Locale;
	userId: string;
	email: string;
}) {
	const { auth } = tServer(locale);
	const t = auth.pending;
	const request = await getAccessRequestOf(userId);

	return (
		<main className="min-h-screen bg-primary-10 px-4 py-10 text-neutral-950">
			<div className="mx-auto flex max-w-lg flex-col gap-6">
				<div className="flex items-center gap-2">
					<Image
						src="/1.png"
						alt=""
						width={40}
						height={43}
						className="size-8 object-contain"
					/>
					<span className="text-xl font-semibold text-primary-700">
						Agricolala
					</span>
				</div>

				<div className="flex flex-col gap-3">
					<h1 className="m-0 text-3xl font-bold tracking-tight text-primary-700">
						{t.title}
					</h1>
					<p className="m-0 text-base leading-relaxed text-neutral-700">
						{t.why}
					</p>
				</div>

				<AccessRequestForm
					locale={locale}
					email={email}
					sentOn={
						request ? formatAccessRequestDate(request.createdAt, locale) : null
					}
					t={t}
				/>

				<div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
					<p className="m-0 text-sm text-neutral-700">
						{t.signedInAs} <strong className="text-neutral-950">{email}</strong>
					</p>
					<SignOutButton
						label={auth.signOut}
						variant="outline"
						className="min-h-11 self-start px-5 sm:self-auto"
					/>
				</div>
			</div>
		</main>
	);
}
