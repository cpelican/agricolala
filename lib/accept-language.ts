import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import {
	appLanguages,
	defaultLocale,
	languageIsLocale,
	type Locale,
} from "./translations-helpers";

const locales: Locale[] = Object.values(appLanguages);

// Best supported locale for an Accept-Language header value.
export function getLocaleFromAcceptLanguage(
	acceptLanguage: string | null,
): Locale {
	const languages = new Negotiator({
		headers: { "accept-language": acceptLanguage ?? "" },
	}).languages();
	const matchedLocale = match(languages, locales, defaultLocale);

	return languageIsLocale(matchedLocale) ? matchedLocale : defaultLocale;
}
