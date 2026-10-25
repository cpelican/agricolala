import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { WelcomeHeader } from "@/components/welcome/welcome-header";
import { WelcomeFooter } from "@/components/welcome/welcome-closing";
import styles from "@/components/welcome/welcome.module.css";
import {
	localizedAlternates,
	localizedPath,
	type PublicPage,
	welcomePath,
} from "@/lib/site-url";
import type { Locale } from "@/lib/i18n/locale";
import type { TranslationType } from "@/lib/i18n/dictionaries";

export const legalMetadata = ({
	locale,
	page,
	title,
	description,
}: {
	locale: Locale;
	page: PublicPage;
	title: string;
	description: string;
}): Metadata => ({
	title: `${title} · Agricolala`,
	description,
	alternates: {
		canonical: localizedPath(locale, page),
		languages: localizedAlternates(page),
	},
	openGraph: {
		type: "article",
		siteName: "Agricolala",
		title: `${title} · Agricolala`,
		description,
		url: localizedPath(locale, page),
	},
	robots: { index: true, follow: true },
});

// Public, server-rendered shell of the legal pages: the site header and footer around the text.
export function LegalPage({
	dict,
	locale,
	page,
	title,
	subtitle,
	children,
}: {
	dict: TranslationType;
	locale: Locale;
	page: PublicPage;
	title: string;
	subtitle: string;
	children: ReactNode;
}) {
	return (
		<div
			className={`${styles.page} min-h-screen bg-primary-10 text-neutral-950`}
		>
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-primary-700 focus:shadow-lg"
			>
				{dict.welcome.skipToContent}
			</a>
			<WelcomeHeader locale={locale} t={dict.welcome} page={page} />
			<main
				id="main"
				tabIndex={-1}
				className="mx-auto max-w-3xl px-4 pt-6 pb-16 outline-none min-[900px]:px-6 min-[900px]:pt-10"
			>
				<Link
					href={welcomePath(locale)}
					className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
				>
					<ChevronLeft aria-hidden="true" className="size-4" />
					{dict.legal.backToHome}
				</Link>
				<header className="mt-4 mb-8 flex flex-col gap-2">
					<h1 className="m-0 text-[28px] leading-[1.1] font-bold tracking-[-0.02em] text-primary-700 min-[900px]:text-4xl">
						{title}
					</h1>
					<p className="m-0 text-base text-neutral-700">{subtitle}</p>
				</header>
				{children}
			</main>
			<WelcomeFooter dict={dict} locale={locale} />
		</div>
	);
}
