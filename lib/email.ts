import "server-only";
import { Resend } from "resend";
import {
	buildAccessGrantedEmail,
	buildAccessRequestNotification,
	type EmailContent,
} from "./access-request-emails";
import { taintUtils } from "./taint-utils";
import { type Locale } from "./translations-helpers";

// RESEND_API_KEY and ACCESS_REQUEST_NOTIFY_EMAIL are secrets: they are read here only,
// never returned to callers and never logged.
taintUtils.taintEmailSecrets();

export type EmailResult = "sent" | "skipped" | "failed";

const SEND_TIMEOUT_MS = 10_000;

const emailDomainOf = (from: string) => {
	const address = from.match(/<([^>]+)>/)?.[1] ?? from;
	return address.split("@").at(-1)?.trim().toLowerCase() ?? "";
};

// Resend's shared test domain only delivers to the Resend account's own address.
const canEmailAnyone = (from: string) => emailDomainOf(from) !== "resend.dev";

async function sendEmail(
	kind: string,
	{
		to,
		replyTo,
		content,
	}: { to: string; replyTo?: string; content: EmailContent },
): Promise<EmailResult> {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.EMAIL_FROM;
	if (!apiKey || !from) {
		console.info(
			`[email] Resend is not configured; skipping the ${kind} email.`,
		);
		return "skipped";
	}

	let timeout: ReturnType<typeof setTimeout> | undefined;
	try {
		const resend = new Resend(apiKey);
		const { error } = await Promise.race([
			resend.emails.send({ from, to, replyTo, ...content }),
			new Promise<never>((_, reject) => {
				timeout = setTimeout(
					() => reject(new Error("Timeout")),
					SEND_TIMEOUT_MS,
				);
			}),
		]);
		if (error) {
			// Resend's message can contain addresses: log its name only.
			console.error(`[email] Resend refused the ${kind} email: ${error.name}`);
			return "failed";
		}
		return "sent";
	} catch (error) {
		console.error(
			`[email] Could not send the ${kind} email:`,
			error instanceof Error ? error.name : "unknown error",
		);
		return "failed";
	} finally {
		clearTimeout(timeout);
	}
}

export async function notifyAdminOfAccessRequest(
	request: Parameters<typeof buildAccessRequestNotification>[0],
): Promise<EmailResult> {
	const to = process.env.ACCESS_REQUEST_NOTIFY_EMAIL;
	if (!to) {
		console.info(
			"[email] ACCESS_REQUEST_NOTIFY_EMAIL is not set; skipping the access request email.",
		);
		return "skipped";
	}

	return sendEmail("access request", {
		to,
		// Replying to the notification answers the person who asked.
		replyTo: request.email,
		content: buildAccessRequestNotification(request),
	});
}

export async function sendAccessGrantedEmail({
	email,
	name,
	locale,
}: {
	email: string;
	name: string | null;
	locale: Locale;
}): Promise<EmailResult> {
	const from = process.env.EMAIL_FROM;
	if (from && !canEmailAnyone(from)) {
		console.info(
			"[email] EMAIL_FROM is on resend.dev, which can't reach users; skipping the access granted email.",
		);
		return "skipped";
	}

	return sendEmail("access granted", {
		to: email,
		content: buildAccessGrantedEmail({ name, locale }),
	});
}
