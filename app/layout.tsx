import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	preload: true,
	adjustFontFallback: true,
});

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
	return (
		<html lang="en" className="agricolala">
			<body className={inter.className}>{children}</body>
		</html>
	);
}
