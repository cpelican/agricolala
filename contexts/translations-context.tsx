"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
	getLocaleFromPathname,
	defaultLocale,
	getLanguageAsLocale,
	languageIsLocale,
	type Locale,
} from "@/lib/translations-helpers";
import type { TranslationType } from "@/lib/translations-server-only";

interface TranslationsContextType {
	t: (key: string) => string;
	// The whole dictionary, for components that read nested values with their real types.
	translations: TranslationType | null;
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
		const key = `substances.${substanceName.toLowerCase()}`;
		const label = t(key);
		return label === key ? substanceName : label;
	};

	return (
		<TranslationsContext.Provider
			value={{
				t,
				translations,
				getArray,
				locale,
				getSubstanceTranslation,
				isLoading,
			}}
		>
			{isLoading ? null : children}
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
