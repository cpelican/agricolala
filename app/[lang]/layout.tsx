import type { ReactNode } from "react";
import "../globals.css";
import {
	RootDocument,
	rootMetadata,
	rootViewport,
} from "@/components/misc/root-document";
import { appLanguages, getLanguageAsLocale } from "@/lib/i18n/locale";

export const metadata = rootMetadata;
export const viewport = rootViewport;

export function generateStaticParams() {
	return Object.values(appLanguages).map((lang) => ({ lang }));
}

// Root layout of every localized page. <html lang> comes from the URL, not from the
// request, so pages that don't read the session (welcome, legal) stay static.
export default async function LangRootLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;

	return (
		<RootDocument lang={getLanguageAsLocale(lang)}>{children}</RootDocument>
	);
}
