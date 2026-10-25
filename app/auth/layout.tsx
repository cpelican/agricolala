import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "../globals.css";
import {
	RootDocument,
	rootMetadata,
	rootViewport,
} from "@/components/layout/root-document";
import { getLocaleFromAcceptLanguage } from "@/lib/i18n/accept-language";
import { defaultLocale } from "@/lib/i18n/locale";
import { tServer } from "@/lib/i18n/server";

const { meta } = tServer(defaultLocale).welcome;

export const metadata: Metadata = {
	...rootMetadata,
	title: "Agricolala - Sign In",
	description: "Sign in to manage your vineyard treatments and parcels",
	// Shared links to app pages unfurl here (no session), so present the app itself.
	openGraph: {
		type: "website",
		siteName: "Agricolala",
		title: meta.title,
		description: meta.description,
	},
	twitter: {
		card: "summary_large_image",
		title: meta.title,
		description: meta.description,
	},
};
export const viewport = rootViewport;

// Root layout of the sign-in pages, which have no locale in their URL. The sign-in text
// follows the browser language (SignInContent), so <html lang> does too. next-auth's
// middleware lets its sign-in page through before our proxy can set a locale header.
export default async function AuthRootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const lang = getLocaleFromAcceptLanguage(
		(await headers()).get("accept-language"),
	);

	return <RootDocument lang={lang}>{children}</RootDocument>;
}
