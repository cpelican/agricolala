export const appLanguages = {
	en: "en",
	it: "it",
} as const;

export type Locale = (typeof appLanguages)[keyof typeof appLanguages];

export const defaultLocale = appLanguages.en;

const localePattern = Object.values(appLanguages).join("|");
export const localeRegex = new RegExp(`^/(${localePattern})`);

const languageIsLocale = (language: string | undefined): language is Locale => {
	if (!language) return false;
	return language in appLanguages;
};

export const getLanguageAsLocale = (language: string | undefined): Locale => {
	if (!language) return defaultLocale;
	return languageIsLocale(language) ? language : defaultLocale;
};

export const getLocaleFromPathname = (pathname: string) => {
	return pathname.startsWith("/it") ? appLanguages.it : appLanguages.en;
};
