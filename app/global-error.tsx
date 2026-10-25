"use client";

import { getDictionary } from "@/lib/i18n/dictionaries";
import {
	defaultLocale,
	getLocaleFromPathname,
	type Locale,
} from "@/lib/i18n/locale";

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
	const copy = getDictionary(locale).errors.page;

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
