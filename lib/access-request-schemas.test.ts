import { describe, expect, test } from "vitest";
import {
	accessRequestSchema,
	approveAccessRequestSchema,
	cleanAccessRequestMessage,
} from "./access-request-schemas";

const message = "I grow two hectares of Vermentino near Sarzana.";

describe("accessRequestSchema", () => {
	test("accepts a message and a locale", () => {
		expect(accessRequestSchema.parse({ message, locale: "it" })).toEqual({
			message,
			locale: "it",
		});
	});

	test("trims the message before counting its length", () => {
		const result = accessRequestSchema.safeParse({
			message: `   ${"a".repeat(19)}   `,
			locale: "en",
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe("tooShort");
	});

	test("accepts 20 and 1000 characters, rejects 1001", () => {
		expect(
			accessRequestSchema.safeParse({ message: "a".repeat(20), locale: "en" })
				.success,
		).toBe(true);
		expect(
			accessRequestSchema.safeParse({ message: "a".repeat(1000), locale: "en" })
				.success,
		).toBe(true);
		const tooLong = accessRequestSchema.safeParse({
			message: "a".repeat(1001),
			locale: "en",
		});
		expect(tooLong.error?.issues[0]?.message).toBe("tooLong");
	});

	test("rejects an unknown locale, a missing message and extra fields", () => {
		expect(
			accessRequestSchema.safeParse({ message, locale: "de" }).success,
		).toBe(false);
		expect(
			accessRequestSchema.safeParse({ message: null, locale: "en" }).success,
		).toBe(false);
		expect(
			accessRequestSchema.safeParse({ message, locale: "en", userId: "x" })
				.success,
		).toBe(false);
	});

	test("drops control and bidirectional characters, keeps line breaks", () => {
		expect(
			cleanAccessRequestMessage("Hello\u0000 there\r\nI grow‮ grapes\tok"),
		).toBe("Hello there\nI grow grapes\tok");
	});
});

describe("approveAccessRequestSchema", () => {
	test("accepts a cuid only", () => {
		expect(
			approveAccessRequestSchema.safeParse({
				userId: "cmh5x0q2b0000a1b2c3d4e5f6",
			}).success,
		).toBe(true);
		expect(
			approveAccessRequestSchema.safeParse({ userId: "' OR 1=1 --" }).success,
		).toBe(false);
	});
});
