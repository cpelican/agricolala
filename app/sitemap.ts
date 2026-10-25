import type { MetadataRoute } from "next";
import {
	localizedAlternates,
	localizedPath,
	PUBLIC_PAGES,
	type PublicPage,
	siteUrl,
} from "@/lib/site-url";
import { appLanguages } from "@/lib/i18n/locale";

const absolute = (path: string) => new URL(path, siteUrl).toString();

const PRIORITIES = {
	[PUBLIC_PAGES.welcome]: 1,
	[PUBLIC_PAGES.privacyPolicy]: 0.3,
	[PUBLIC_PAGES.termsOfService]: 0.3,
} satisfies Record<PublicPage, number>;

export default function sitemap(): MetadataRoute.Sitemap {
	return Object.values(PUBLIC_PAGES).flatMap((page) => {
		const languages = Object.fromEntries(
			Object.entries(localizedAlternates(page)).map(([language, path]) => [
				language,
				absolute(path),
			]),
		);

		return Object.values(appLanguages).map((locale) => ({
			url: absolute(localizedPath(locale, page)),
			changeFrequency: "monthly" as const,
			priority: PRIORITIES[page],
			alternates: { languages },
		}));
	});
}
