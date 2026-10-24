import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "../globals.css";
import {
	RootDocument,
	rootMetadata,
	rootViewport,
} from "@/components/misc/root-document";
import { getLocaleFromAcceptLanguage } from "@/lib/accept-language";

export const metadata: Metadata = {
	...rootMetadata,
	title: "Agricolala - Sign In",
	description: "Sign in to manage your vineyard treatments and parcels",
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
