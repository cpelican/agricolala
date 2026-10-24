import { appLanguages, type Locale } from "./translations-helpers";

// Absolute origin used for canonical URLs, hreflang links, the sitemap and Open Graph.
// NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is provided automatically.
export const siteUrl = new URL(
	process.env.NEXT_PUBLIC_SITE_URL ??
		(process.env.VERCEL_PROJECT_PRODUCTION_URL
			? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
			: "http://localhost:3000"),
);

export const welcomePath = (locale: Locale) => `/${locale}/welcome`;

// hreflang map for the public welcome page, x-default pointing at English.
export const welcomeAlternates = {
	...Object.fromEntries(
		Object.values(appLanguages).map((locale) => [locale, welcomePath(locale)]),
	),
	"x-default": welcomePath(appLanguages.en),
};

export const GITHUB_REPOSITORY_URL = "https://github.com/cpelican/agricolala";
