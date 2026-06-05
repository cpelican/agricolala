"use client";

import en from "@/locales/en.json";
import it from "@/locales/it.json";
import {
	defaultLocale,
	getLocaleFromPathname,
	type Locale,
} from "@/lib/translations-helpers";

const errorCopy = {
	en: en.errors.page,
	it: it.errors.page,
} as const;

function getClientLocale(): Locale {
	if (typeof window === "undefined") {
		return defaultLocale;
	}
	return getLocaleFromPathname(window.location.pathname);
}

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
	const locale = getClientLocale();
	const copy = errorCopy[locale];

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className="min-h-screen bg-background p-4 font-sans text-foreground">
				<main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 text-center">
					<h1 className="text-2xl font-semibold">{copy.title}</h1>
					<p className="text-sm text-muted-foreground">{copy.description}</p>
					<button
						type="button"
						onClick={reset}
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
					>
						{copy.tryAgain}
					</button>
				</main>
			</body>
		</html>
	);
}
