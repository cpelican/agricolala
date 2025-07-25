"use client";

import { usePathname } from "next/navigation";
import {
	appLanguages,
	defaultLocale,
	getLanguageAsLocale,
	getLocaleFromPathname,
	type Locale,
} from "./server-translations";
import { useState, useEffect } from "react";
import type { Dictionary } from "./dictionaries";

export function useTranslations(localeFromBrowser?: Locale) {
	const pathname = usePathname();
	const localeFromPathname = getLocaleFromPathname(pathname);
	const locale = localeFromBrowser || localeFromPathname;

	const [translations, setTranslations] = useState<Dictionary | null>(null);

	useEffect(() => {
		import(`../locales/${locale}.json`)
			.then((module) => setTranslations(module.default))
			.catch(() => {
				import(`../locales/${defaultLocale}.json`).then((module) =>
					setTranslations(module.default),
				);
			});
	}, [locale]);

	const t = (key: string): string => {
		if (!translations) return key;
		// @ts-expect-error: this type would be really complicated
		return key.split(".").reduce((obj, k) => obj?.[k], translations) || key;
	};

	const getArray = (key: string): string[] => {
		if (!translations) return [];
		// @ts-expect-error: this type would be really complicated
		const value = key.split(".").reduce((obj, k) => obj?.[k], translations);
		return Array.isArray(value) ? value : [];
	};

	const getSubstanceTranslation = (substanceName: string): string => {
		const name = substanceName.toLowerCase();
		return t(`substances.${name}`) || substanceName;
	};

	return {
		t,
		getArray,
		locale,
		getSubstanceTranslation,
	};
}

export const getLocaleFromBrowser = (): Locale => {
	const browserLang =
		navigator.language ||
		navigator.languages?.find((lang) => lang in appLanguages);
	return getLanguageAsLocale(browserLang);
};
