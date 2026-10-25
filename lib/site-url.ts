import { appLanguages, type Locale } from "./i18n/locale";

// Absolute origin used for canonical URLs, hreflang links, the sitemap and Open Graph.
// NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is provided automatically.
export const siteUrl = new URL(
	process.env.NEXT_PUBLIC_SITE_URL ??
		(process.env.VERCEL_PROJECT_PRODUCTION_URL
			? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
			: "http://localhost:3000"),
);

// Public pages, by their path without the locale prefix.
export const PUBLIC_PAGES = {
	welcome: "/welcome",
	privacyPolicy: "/legal/privacy-policy",
	termsOfService: "/legal/terms-of-service",
} as const;

export type PublicPage = (typeof PUBLIC_PAGES)[keyof typeof PUBLIC_PAGES];

export const localizedPath = (locale: Locale, page: PublicPage) =>
	`/${locale}${page}`;

export const welcomePath = (locale: Locale) =>
	localizedPath(locale, PUBLIC_PAGES.welcome);

// hreflang map for a public page, x-default pointing at English.
export const localizedAlternates = (page: PublicPage) => ({
	...Object.fromEntries(
		Object.values(appLanguages).map((locale) => [
			locale,
			localizedPath(locale, page),
		]),
	),
	"x-default": localizedPath(appLanguages.en, page),
});

export const GITHUB_REPOSITORY_URL = "https://github.com/cpelican/agricolala";
