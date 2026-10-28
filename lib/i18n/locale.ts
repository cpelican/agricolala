export const appLanguages = {
	en: "en",
	it: "it",
	fr: "fr",
} as const;

export const LOCALE_HEADER = "x-locale";

// The language of the last localized page the visitor opened: their latest choice,
// whether they picked it on the website, in their profile, or by following a link.
export const LOCALE_COOKIE = "NEXT_LOCALE";

export type Locale = (typeof appLanguages)[keyof typeof appLanguages];

export const defaultLocale = appLanguages.en;

const localePattern = Object.values(appLanguages).join("|");
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

export const getLocaleFromPathname = (pathname: string): Locale => {
	return getLanguageAsLocale(pathname.match(localeRegex)?.[1]);
};
