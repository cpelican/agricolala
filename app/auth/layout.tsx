import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import {
	RootDocument,
	rootMetadata,
	rootViewport,
} from "@/components/layout/root-document";
import { defaultLocale } from "@/lib/i18n/locale";
import { getRequestLocale, tServer } from "@/lib/i18n/server";

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

// Root layout of the sign-in pages, which have no locale in their URL. <html lang> uses
// the same language as the sign-in text (getRequestLocale). next-auth's middleware lets
// its sign-in page through before our proxy can set a locale header.
export default async function AuthRootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const lang = await getRequestLocale();

	return <RootDocument lang={lang}>{children}</RootDocument>;
}
