"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	type AccessRequestState,
	requestAccess,
} from "@/lib/actions-access-requests";
import {
	ACCESS_REQUEST_MESSAGE_MAX,
	ACCESS_REQUEST_MESSAGE_MIN,
} from "@/lib/access-request-schemas";
import { type Locale } from "@/lib/translations-helpers";
import type enDict from "@/locales/en.json";

type PendingDict = typeof enDict.auth.pending;

const cardClassName =
	"flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-xs";

// The introduction form, then (once sent, now or on an earlier visit) the confirmation.
export function AccessRequestForm({
	locale,
	email,
	sentOn,
	t,
}: {
	locale: Locale;
	email: string;
	sentOn: string | null;
	t: PendingDict;
}) {
	const [state, formAction, isPending] = useActionState<
		AccessRequestState,
		FormData
	>(requestAccess, { status: "idle" });
	// Controlled, so the text survives React's form reset when the server sends an error back.
	const [message, setMessage] = useState("");
	const sentTitleRef = useRef<HTMLHeadingElement>(null);
	const ids = {
		title: useId(),
		message: useId(),
		hint: useId(),
		error: useId(),
	};

	const sentDate = state.status === "sent" ? state.sentOn : sentOn;

	useEffect(() => {
		if (state.status === "sent") {
			sentTitleRef.current?.focus();
		}
	}, [state.status]);

	if (sentDate) {
		return (
			<section aria-labelledby={ids.title} className={cardClassName}>
				<h2
					id={ids.title}
					ref={sentTitleRef}
					tabIndex={-1}
					className="m-0 text-lg font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
				>
					{t.sentTitle.replace("{date}", sentDate)}
				</h2>
				<p className="m-0 text-sm leading-relaxed text-neutral-700">
					{t.sentText
						.replace("{delay}", t.replyDelay)
						.replace("{email}", email)}
				</p>
			</section>
		);
	}

	const error =
		state.status === "error"
			? {
					tooShort: t.errorTooShort,
					tooLong: t.errorTooLong,
					generic: t.errorGeneric,
				}[state.error]
			: null;

	return (
		<>
			<section aria-labelledby={ids.title} className={cardClassName}>
				<h2 id={ids.title} className="m-0 text-lg font-semibold">
					{t.requestTitle}
				</h2>
				<form action={formAction} className="flex flex-col gap-3" noValidate>
					<input type="hidden" name="locale" value={locale} />
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor={ids.message}
							className="text-base font-medium text-neutral-950"
						>
							{t.messageLabel}
						</label>
						<p id={ids.hint} className="m-0 text-sm text-neutral-700">
							{t.messageHint}
						</p>
						<textarea
							id={ids.message}
							name="message"
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							rows={5}
							required
							minLength={ACCESS_REQUEST_MESSAGE_MIN}
							maxLength={ACCESS_REQUEST_MESSAGE_MAX}
							aria-describedby={error ? `${ids.hint} ${ids.error}` : ids.hint}
							aria-invalid={error ? true : undefined}
							className="min-h-32 w-full resize-y rounded-md border border-neutral-400 bg-white px-3 py-2 text-base text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 aria-invalid:border-red-700"
						/>
						{error && (
							<p
								id={ids.error}
								role="alert"
								className="m-0 text-sm font-medium text-red-700"
							>
								{error}
							</p>
						)}
					</div>
					<Button
						type="submit"
						size="lg"
						aria-disabled={isPending}
						className="min-h-11 self-start px-5 text-base"
					>
						<Send aria-hidden="true" />
						{isPending ? t.sending : t.submit}
					</Button>
				</form>
			</section>

			<section
				aria-labelledby={`${ids.title}-next`}
				className="flex flex-col gap-2"
			>
				<h2 id={`${ids.title}-next`} className="m-0 text-lg font-semibold">
					{t.nextTitle}
				</h2>
				<p className="m-0 text-sm leading-relaxed text-neutral-700">
					{t.nextText
						.replace("{delay}", t.replyDelay)
						.replace("{email}", email)}
				</p>
			</section>
		</>
	);
}
