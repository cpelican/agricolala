import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getLocaleFromAcceptLanguage } from "./accept-language";
import { getDictionary } from "./dictionaries";
import { LOCALE_COOKIE, languageIsLocale, type Locale } from "./locale";

// Translations for server components; client components use `useTranslations`.
export const tServer = cache(getDictionary);

// Language for pages without a locale in their URL (sign-in): the visitor's latest
// choice, remembered by the proxy, then the browser language.
export const getRequestLocale = cache(async (): Promise<Locale> => {
	const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
	if (languageIsLocale(cookieLocale)) {
		return cookieLocale;
	}
	return getLocaleFromAcceptLanguage((await headers()).get("accept-language"));
});
