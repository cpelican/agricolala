import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SignOutButton } from "@/components/auth/signout-button";
import { GITHUB_REPOSITORY_URL } from "@/lib/site-url";
import type { Locale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

// Prefilled GitHub issue. The repository is public, so it carries only the account code
// (see accountCodeOf), never the email or name.
const accessRequestIssueUrl = (title: string, body: string) => {
	const url = new URL(`${GITHUB_REPOSITORY_URL}/issues/new`);
	url.searchParams.set("title", title);
	url.searchParams.set("body", body);
	return url.toString();
};

// Short, non-personal reference to an account, safe to post publicly: the end of its id
// (cuid's random part). Find the account in Prisma Studio with "id contains <code>".
export const accountCodeOf = (userId: string) => userId.slice(-8);

// Shown instead of the app while an account waits to be opened by hand.
export function AccessPending({
	locale,
	email,
	accountCode,
}: {
	locale: Locale;
	email: string | null | undefined;
	accountCode: string;
}) {
	const { auth } = tServer(locale);
	const t = auth.pending;
	const issueUrl = accessRequestIssueUrl(
		t.issueTitle.replace("{code}", accountCode),
		t.issueBody.replace("{code}", accountCode),
	);

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

				<section
					aria-labelledby="access-request-title"
					className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-xs"
				>
					<h2 id="access-request-title" className="m-0 text-lg font-semibold">
						{t.requestTitle}
					</h2>
					<p className="m-0 text-sm leading-relaxed text-neutral-700">
						{t.requestText}
					</p>
					<p className="m-0 text-sm text-neutral-700">
						{t.accountCode}:{" "}
						<code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm text-neutral-950">
							{accountCode}
						</code>
					</p>
					<a
						href={issueUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground no-underline hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
					>
						{t.requestCta}
						<ExternalLink aria-hidden="true" className="size-4" />
						<span className="sr-only"> {t.opensInNewTab}</span>
					</a>
				</section>

				<section
					aria-labelledby="access-next-title"
					className="flex flex-col gap-2"
				>
					<h2 id="access-next-title" className="m-0 text-lg font-semibold">
						{t.nextTitle}
					</h2>
					<p className="m-0 text-sm leading-relaxed text-neutral-700">
						{t.nextText}
					</p>
				</section>

				<div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
					{email && (
						<p className="m-0 text-sm text-neutral-600">
							{t.signedInAs}{" "}
							<strong className="text-neutral-950">{email}</strong>
						</p>
					)}
					<SignOutButton
						label={auth.signOut}
						variant="outline"
						className="self-start sm:self-auto"
					/>
				</div>
			</div>
		</main>
	);
}
