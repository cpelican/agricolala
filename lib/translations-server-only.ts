import "server-only";
import { defaultLocale, type Locale } from "./translations-helpers";

import enDict from "../locales/en.json";
import itDict from "../locales/it.json";
import { cache } from "react";

export const dictionaries = {
	en: enDict,
	it: itDict,
};

export const tServer = cache((locale?: Locale) => {
	const localeToUse = locale || defaultLocale;
	return dictionaries[localeToUse];
});

export type TranslationType = Awaited<ReturnType<typeof tServer>>;
