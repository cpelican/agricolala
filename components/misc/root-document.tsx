import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { inter } from "@/app/const";
import { siteUrl } from "@/lib/site-url";
import type { Locale } from "@/lib/translations-helpers";

// The app has two root layouts (app/[lang] and app/auth), so the <html> shell and the
// defaults they share live here.
export const rootMetadata: Metadata = {
	metadataBase: siteUrl,
	title: "Agricolala - Vineyard Management",
	description: "Manage your vineyard treatments and parcels",
};

export const rootViewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export function RootDocument({
	lang,
	children,
}: {
	lang: Locale;
	children: ReactNode;
}) {
	return (
		<html lang={lang} className="agricolala">
			<body className={inter.className}>{children}</body>
		</html>
	);
}
