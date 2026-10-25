"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUBSECTION_TITLE } from "@/components/ui/typography";
import {
	type ApproveAccessRequestState,
	approveAccessRequest,
} from "@/lib/actions-access-requests";
import type { TranslationType } from "@/lib/i18n/dictionaries";
import type { AccessRequest, User } from "@prisma/client";

type AdminDict = TranslationType["auth"]["admin"];

type PendingRequest = Pick<AccessRequest, "userId" | "message"> &
	Pick<User, "name" | "email" | "locale"> & { requestedOn: string };

// One action state for the whole list: an approved row leaves the list, but the
// outcome ("email not sent") must stay on screen.
export function PendingAccessRequests({
	requests,
	t,
}: {
	requests: PendingRequest[];
	t: AdminDict;
}) {
	const [state, formAction, isPending] = useActionState<
		ApproveAccessRequestState,
		FormData
	>(approveAccessRequest, { status: "idle" });

	return (
		<section aria-labelledby="pending-requests" className="flex flex-col gap-3">
			<h2 id="pending-requests" className={SUBSECTION_TITLE}>
				{t.pendingTitle}
			</h2>

			<div role="status" aria-live="polite">
				{state.status === "approved" && (
					<p
						className={`m-0 rounded-lg border p-3 text-sm font-medium ${
							state.emailSent
								? "border-primary-200 bg-primary-50 text-primary-700"
								: "border-amber-300 bg-amber-50 text-amber-900"
						}`}
					>
						{(state.emailSent
							? t.approvedEmailSent
							: t.approvedEmailNotSent
						).replace("{name}", state.name)}
					</p>
				)}
				{state.status === "error" && (
					<p className="m-0 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
						{t.approveError}
					</p>
				)}
			</div>

			{requests.length === 0 ? (
				<p className="m-0 text-base text-neutral-700">{t.pendingEmpty}</p>
			) : (
				<ul className="m-0 flex list-none flex-col gap-3 p-0">
					{requests.map((request) => (
						<li
							key={request.userId}
							className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-xs"
						>
							<div>
								<h3 className="m-0 text-base font-semibold text-neutral-950">
									{request.name ?? t.noName}
								</h3>
								<p className="m-0 text-sm break-all text-neutral-700">
									{request.email}
								</p>
								<p className="m-0 text-sm text-neutral-700">
									{t.requestedOn.replace("{date}", request.requestedOn)} ·{" "}
									{t.language}: {request.locale}
								</p>
							</div>
							<p className="m-0 text-base whitespace-pre-line break-words text-neutral-950">
								{request.message}
							</p>
							<form action={formAction}>
								<input type="hidden" name="userId" value={request.userId} />
								<Button
									type="submit"
									size="lg"
									aria-disabled={isPending}
									aria-label={`${t.approve} ${request.name ?? request.email}`}
									className="min-h-11 px-5 text-base"
								>
									<Check aria-hidden="true" />
									{isPending ? t.approving : t.approve}
								</Button>
							</form>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
