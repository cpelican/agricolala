import { defaultLocale, type Locale } from "./locale";

import enDict from "../../locales/en.json";
import itDict from "../../locales/it.json";

// The translations themselves. Server components read them through `tServer`
// (./server), client components through `useTranslations`
// (@/contexts/translations-context); code outside React imports them here.
export const dictionaries = {
	en: enDict,
	it: itDict,
} satisfies Record<Locale, typeof enDict>;

export const getDictionary = (locale?: Locale) =>
	dictionaries[locale || defaultLocale];

export type TranslationType = typeof enDict;
