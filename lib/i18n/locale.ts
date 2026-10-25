export const appLanguages = {
	en: "en",
	it: "it",
	fr: "fr",
} as const;

export const LOCALE_HEADER = "x-locale";

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

export const getLocaleFromBrowser = (): Locale => {
	// SSR has no navigator; sign-in renders null until the client session check, so the real UI uses the browser locale.
	if (typeof navigator === "undefined") {
		return defaultLocale;
	}
	// Browsers report regional tags ("it-IT"): match on the base language, in the user's
	// order of preference, like the Accept-Language negotiation on the server.
	const preferred = navigator.languages?.length
		? navigator.languages
		: [navigator.language];
	const supported = preferred
		.map((tag) => tag.split("-")[0]?.toLowerCase())
		.find((language) => languageIsLocale(language));
	return getLanguageAsLocale(supported);
};
