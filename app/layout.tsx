import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type React from "react";
import "./globals.css";
import { defaultLocale, LOCALE_HEADER } from "@/lib/translations-helpers";
import { inter } from "./const";

export const metadata: Metadata = {
	title: "Agricolala - Wineyard Management",
	description: "Manage your wineyard treatments and parcels",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Get the locale from the header set by middleware
	const headersList = await headers();
	const lang = headersList.get(LOCALE_HEADER) ?? defaultLocale;

	return (
		<html lang={lang} className="agricolala">
			<body className={inter.className}>{children}</body>
		</html>
	);
}
