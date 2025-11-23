import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	preload: true,
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "Agricolala - Wineyard Management",
	description: "Manage your wineyard treatments and parcels",
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="agricolala">
			<body className={inter.className}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
