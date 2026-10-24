import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WelcomeHeader } from "@/components/welcome/welcome-header";
import styles from "@/components/welcome/welcome.module.css";
import { WelcomeHero } from "@/components/welcome/welcome-hero";
import { WelcomeSeason } from "@/components/welcome/welcome-season";
import {
	WelcomeApp,
	WelcomeUsage,
} from "@/components/welcome/welcome-features";
import {
	WelcomeCallToAction,
	WelcomeFooter,
	WelcomeOpenSource,
} from "@/components/welcome/welcome-closing";
import {
	GITHUB_REPOSITORY_URL,
	siteUrl,
	localizedAlternates,
	PUBLIC_PAGES,
	welcomePath,
} from "@/lib/site-url";
import { appLanguages, languageIsLocale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

// Public marketing page: one static page per language (params from app/[lang]/layout.tsx).
export const dynamicParams = false;

const OG_LOCALES = { en: "en_GB", it: "it_IT" } as const;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ lang: string }>;
}): Promise<Metadata> {
	const { lang } = await params;
	if (!languageIsLocale(lang)) return {};
	const { meta } = tServer(lang).welcome;

	return {
		title: meta.title,
		description: meta.description,
		applicationName: "Agricolala",
		alternates: {
			canonical: welcomePath(lang),
			languages: localizedAlternates(PUBLIC_PAGES.welcome),
		},
		openGraph: {
			type: "website",
			siteName: "Agricolala",
			title: meta.title,
			description: meta.description,
			url: welcomePath(lang),
			locale: OG_LOCALES[lang],
			alternateLocale: Object.values(appLanguages)
				.filter((locale) => locale !== lang)
				.map((locale) => OG_LOCALES[locale]),
		},
		twitter: {
			card: "summary_large_image",
			title: meta.title,
			description: meta.description,
		},
		robots: { index: true, follow: true },
	};
}

export default async function WelcomePage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	if (!languageIsLocale(lang)) notFound();
	const dict = tServer(lang);
	const t = dict.welcome;

	const structuredData = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "Agricolala",
		url: new URL(welcomePath(lang), siteUrl).toString(),
		description: t.meta.description,
		inLanguage: lang,
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web",
		isAccessibleForFree: true,
		offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
		sameAs: [GITHUB_REPOSITORY_URL],
	};

	return (
		<div
			className={`${styles.page} min-h-screen bg-primary-10 text-neutral-950`}
		>
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-primary-700 focus:shadow-lg"
			>
				{t.skipToContent}
			</a>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
				}}
			/>
			<WelcomeHeader locale={lang} t={t} />
			<main id="main" tabIndex={-1} className="outline-none">
				<WelcomeHero locale={lang} t={t} />
				<WelcomeSeason dict={dict} />
				<WelcomeApp dict={dict} />
				<WelcomeUsage dict={dict} locale={lang} />
				<WelcomeOpenSource dict={dict} />
				<WelcomeCallToAction dict={dict} />
			</main>
			<WelcomeFooter dict={dict} locale={lang} />
		</div>
	);
}
