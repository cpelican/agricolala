import type { MetadataRoute } from "next";
import { siteUrl, welcomeAlternates, welcomePath } from "@/lib/site-url";
import { appLanguages } from "@/lib/translations-helpers";

const absolute = (path: string) => new URL(path, siteUrl).toString();

export default function sitemap(): MetadataRoute.Sitemap {
	const languages = Object.fromEntries(
		Object.entries(welcomeAlternates).map(([language, path]) => [
			language,
			absolute(path),
		]),
	);

	return Object.values(appLanguages).map((locale) => ({
		url: absolute(welcomePath(locale)),
		changeFrequency: "monthly",
		priority: 1,
		alternates: { languages },
	}));
}
