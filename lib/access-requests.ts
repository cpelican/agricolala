import { type Locale } from "./i18n/locale";

// Fixed time zone so the server and the browser print the same day.
export const formatAccessRequestDate = (date: Date, locale: Locale) =>
	new Intl.DateTimeFormat(locale, {
		dateStyle: "long",
		timeZone: "Europe/Rome",
	}).format(date);
