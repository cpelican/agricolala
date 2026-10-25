import { siteUrl } from "./site-url";
import { type Locale } from "./translations-helpers";
import enDict from "../locales/en.json";
import itDict from "../locales/it.json";

const grantedEmailDicts = {
	en: enDict.auth.grantedEmail,
	it: itDict.auth.grantedEmail,
} satisfies Record<Locale, typeof enDict.auth.grantedEmail>;

export type EmailContent = {
	subject: string;
	text: string;
	html: string;
};

const htmlEscapes: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, (character) => htmlEscapes[character] ?? "");

// A subject is a header: no line breaks, and short enough to read in an inbox.
const toSubject = (value: string) =>
	value
		.replace(/[\r\n]+/g, " ")
		.trim()
		.slice(0, 150);

const paragraphsToHtml = (text: string) =>
	text
		.split(/\n{2,}/)
		.map(
			(paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
		)
		.join("");

const layoutHtml = (body: string) =>
	`<!doctype html><html><body style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#171717;max-width:560px">${body}</body></html>`;

const adminAccessRequestsUrl = () =>
	new URL("/en/admin/access-requests", siteUrl).toString();

const signInUrl = (locale: Locale) => new URL(`/${locale}`, siteUrl).toString();

// For me only, so in English.
export function buildAccessRequestNotification({
	name,
	email,
	locale,
	message,
	requestedAt,
}: {
	name: string | null;
	email: string;
	locale: string;
	message: string;
	requestedAt: Date;
}): EmailContent {
	const adminUrl = adminAccessRequestsUrl();
	const date = requestedAt.toISOString();
	const details = [
		`Name: ${name ?? "(none)"}`,
		`Email: ${email}`,
		`Language: ${locale}`,
		`Requested: ${date}`,
	];

	return {
		subject: toSubject(`New access request: ${name || email}`),
		text: [
			...details,
			"",
			"Message:",
			message,
			"",
			`Review it: ${adminUrl}`,
		].join("\n"),
		html: layoutHtml(
			[
				'<h1 style="font-size:20px">New access request</h1>',
				`<ul>${details.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`,
				'<h2 style="font-size:16px">Message</h2>',
				`<blockquote style="margin:0;padding-left:12px;border-left:3px solid #d4d4d4">${paragraphsToHtml(message)}</blockquote>`,
				`<p><a href="${escapeHtml(adminUrl)}">Review access requests</a></p>`,
			].join(""),
		),
	};
}

export function buildAccessGrantedEmail({
	name,
	locale,
}: {
	name: string | null;
	locale: Locale;
}): EmailContent {
	const t = grantedEmailDicts[locale];
	const url = signInUrl(locale);
	const greeting = name ? t.greeting.replace("{name}", name) : t.greetingNoName;

	return {
		subject: toSubject(t.subject),
		text: [greeting, "", t.body, "", `${t.cta}: ${url}`, "", t.footer].join(
			"\n",
		),
		html: layoutHtml(
			[
				`<p>${escapeHtml(greeting)}</p>`,
				`<p>${escapeHtml(t.body)}</p>`,
				`<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;background:#006b1d;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(t.cta)}</a></p>`,
				`<p style="font-size:13px;color:#525252">${escapeHtml(t.footer)}</p>`,
			].join(""),
		),
	};
}
