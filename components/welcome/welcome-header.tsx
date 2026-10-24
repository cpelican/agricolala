import Image from "next/image";
import Link from "next/link";
import { appLanguages, type Locale } from "@/lib/translations-helpers";
import {
	localizedPath,
	PUBLIC_PAGES,
	type PublicPage,
	welcomePath,
} from "@/lib/site-url";
import type { WelcomeDictionary } from "./types";
import styles from "./welcome.module.css";

const LANGUAGE_CODES = {
	en: "EN",
	it: "IT",
} as const satisfies Record<Locale, string>;

export function WelcomeHeader({
	locale,
	t,
	page = PUBLIC_PAGES.welcome,
}: {
	locale: Locale;
	t: WelcomeDictionary;
	// The page the language links switch between.
	page?: PublicPage;
}) {
	return (
		<header className="relative z-10 mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 min-[900px]:h-20 min-[900px]:px-6">
			<Link
				href={welcomePath(locale)}
				aria-label={t.homeLink}
				className="flex items-center gap-2 rounded-md no-underline"
			>
				<Image
					src="/1.png"
					alt=""
					width={40}
					height={43}
					className="size-7 object-contain min-[900px]:size-8"
				/>
				<span
					className={`${styles.wordmark} text-xl leading-6 font-bold tracking-[-0.01em] min-[900px]:text-[22px] min-[900px]:leading-7`}
				>
					Agricolala
				</span>
			</Link>
			<nav
				aria-label={t.accountNav}
				className="flex items-center gap-1 min-[900px]:gap-4"
			>
				<ul
					aria-label={t.languageLabel}
					className="m-0 flex list-none items-center p-0 text-[13px] leading-5 font-medium"
				>
					{Object.values(appLanguages).map((language, index) => (
						<li key={language} className="flex items-center">
							{index > 0 && (
								<span aria-hidden="true" className="text-neutral-300">
									/
								</span>
							)}
							{/* A full page load, not a client-side Link: the root layout sets <html lang>
							    from the request, and a soft navigation would keep the old language. */}
							<a
								href={localizedPath(language, page)}
								hrefLang={language}
								lang={language}
								aria-current={language === locale ? "page" : undefined}
								className={`inline-flex h-11 items-center px-1.5 no-underline hover:underline ${
									language === locale ? "text-primary-700" : "text-neutral-600"
								}`}
							>
								{LANGUAGE_CODES[language]}
								<span className="sr-only"> {t.languages[language]}</span>
							</a>
						</li>
					))}
				</ul>
				<Link
					href="/auth/signin"
					className="inline-flex h-11 items-center rounded-md px-2 pl-3 text-sm font-medium text-primary-700 no-underline hover:underline min-[900px]:h-10 min-[900px]:border min-[900px]:border-neutral-200 min-[900px]:bg-white min-[900px]:px-4 min-[900px]:text-neutral-950 min-[900px]:hover:bg-neutral-100 min-[900px]:hover:no-underline"
				>
					{t.signIn}
				</Link>
			</nav>
		</header>
	);
}
