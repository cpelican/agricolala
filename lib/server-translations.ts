import { type NextRequest } from "next/server";

export const appLanguages = {
	en: "en",
	it: "it",
} as const;

export const localePattern = Object.values(appLanguages).join("|");
export const localeRegex = new RegExp(`^/(${localePattern})`);

export const languageIsLocale = (
	language: string | undefined,
): language is Locale => {
	if (!language) return false;
	return language in appLanguages;
};

export const getLanguageAsLocale = (language: string | undefined): Locale => {
	if (!language) return defaultLocale;
	return languageIsLocale(language) ? language : defaultLocale;
};

export type Locale = (typeof appLanguages)[keyof typeof appLanguages];

export const defaultLocale = appLanguages.en;

export const getLocaleFromPathname = (pathname: string) => {
	return pathname.startsWith("/it") ? appLanguages.it : appLanguages.en;
};

export const getLocaleFromRequest = (request: NextRequest): Locale => {
	const acceptLanguage = request.headers.get("accept-language") || "";
	return acceptLanguage.includes("it") ? appLanguages.it : appLanguages.en;
};
