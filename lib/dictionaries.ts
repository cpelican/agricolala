import "server-only";
import { type Locale } from "./server-translations";

const dictionaries = {
	en: () => import("../locales/en.json").then((module) => module.default),
	it: () => import("../locales/it.json").then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
	const localeToUse = locale || "en";
	return dictionaries[localeToUse]();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
