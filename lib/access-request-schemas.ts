import z from "zod";
import { appLanguages } from "./translations-helpers";

export const ACCESS_REQUEST_MESSAGE_MIN = 20;
export const ACCESS_REQUEST_MESSAGE_MAX = 1000;

// Validation messages double as error codes: the form maps them to translations.
export const accessRequestErrors = {
	tooShort: "tooShort",
	tooLong: "tooLong",
} as const;

// Control characters and bidirectional overrides can hide or reorder text in the admin
// email and page. Line breaks and tabs stay.
const invisibleCharacters = /[\p{Cc}‪-‮⁦-⁩]/gu;

export const cleanAccessRequestMessage = (message: string) =>
	message
		.replace(/\r\n?/g, "\n")
		.replace(invisibleCharacters, (character) =>
			character === "\n" || character === "\t" ? character : "",
		)
		.trim();

export const accessRequestSchema = z
	.object({
		message: z
			.string()
			// Rejects oversized payloads before cleaning them.
			.max(ACCESS_REQUEST_MESSAGE_MAX * 4, accessRequestErrors.tooLong)
			.transform(cleanAccessRequestMessage)
			.pipe(
				z
					.string()
					.min(ACCESS_REQUEST_MESSAGE_MIN, accessRequestErrors.tooShort)
					.max(ACCESS_REQUEST_MESSAGE_MAX, accessRequestErrors.tooLong),
			),
		locale: z.enum(appLanguages),
	})
	.strict();

export const approveAccessRequestSchema = z
	.object({
		userId: z.cuid(),
	})
	.strict();
