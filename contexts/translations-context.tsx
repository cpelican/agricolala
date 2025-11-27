"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
	getLocaleFromPathname,
	defaultLocale,
	getLanguageAsLocale,
	appLanguages,
	Locale,
} from "@/lib/translations-helpers";
import type { TranslationType } from "@/lib/translations-server-only";

interface TranslationsContextType {
	t: (key: string) => string;
	getArray: (key: string) => string[];
	locale: string;
	getSubstanceTranslation: (substanceName: string) => string;
	isLoading: boolean;
}

const TranslationsContext = createContext<TranslationsContextType | null>(null);

export function TranslationsProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const locale = getLocaleFromPathname(pathname);
	const [translations, setTranslations] = useState<TranslationType | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsLoading(true);

		import(`@/locales/${locale}.json`)
			.then((module) => {
				setTranslations(module.default);
				setIsLoading(false);
			})
			.catch(() => {
				import(`@/locales/${defaultLocale}.json`).then((module) => {
					setTranslations(module.default);
					setIsLoading(false);
				});
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

	return (
		<TranslationsContext.Provider
			value={{
				t,
				getArray,
				locale,
				getSubstanceTranslation,
				isLoading,
			}}
		>
			{children}
		</TranslationsContext.Provider>
	);
}

export function useTranslations() {
	const context = useContext(TranslationsContext);
	if (!context) {
		throw new Error("useTranslations must be used within TranslationsProvider");
	}

	return context;
}

export const getLocaleFromBrowser = (): Locale => {
	const browserLang =
		navigator.language ||
		navigator.languages?.find((lang) => lang in appLanguages);
	return getLanguageAsLocale(browserLang);
};
