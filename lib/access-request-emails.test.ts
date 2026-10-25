import { describe, expect, test } from "vitest";
import {
	buildAccessGrantedEmail,
	buildAccessRequestNotification,
} from "./access-request-emails";

describe("buildAccessRequestNotification", () => {
	const request = {
		name: "Ada <script>",
		email: "ada@example.com",
		locale: "it",
		message: "Hi!\nI grow <b>Vermentino</b>.",
		requestedAt: new Date("2026-10-25T08:00:00Z"),
	};

	test("names the person in the subject, on one line", () => {
		expect(
			buildAccessRequestNotification({ ...request, name: "Ada\r\nBcc: x" })
				.subject,
		).toBe("New access request: Ada Bcc: x");
		expect(
			buildAccessRequestNotification({ ...request, name: null }).subject,
		).toBe("New access request: ada@example.com");
	});

	test("escapes what the user wrote in the HTML version", () => {
		const { html, text } = buildAccessRequestNotification(request);
		expect(html).not.toContain("<script>");
		expect(html).not.toContain("<b>");
		expect(html).toContain("&lt;b&gt;Vermentino&lt;/b&gt;");
		expect(text).toContain("I grow <b>Vermentino</b>.");
	});

	test("links to the admin page", () => {
		const { text } = buildAccessRequestNotification(request);
		expect(text).toMatch(
			/Review it: https?:\/\/.+\/en\/admin\/access-requests/,
		);
	});
});

describe("buildAccessGrantedEmail", () => {
	test("is written in the user's language", () => {
		expect(buildAccessGrantedEmail({ name: "Ada", locale: "it" }).subject).toBe(
			"Il tuo quaderno Agricolala è aperto",
		);
		const english = buildAccessGrantedEmail({ name: null, locale: "en" });
		expect(english.subject).toBe("Your Agricolala notebook is open");
		expect(english.text).toMatch(/^Hi,\n/);
		expect(english.text).toMatch(/Sign in: https?:\/\/.+\/en/);
	});
});
