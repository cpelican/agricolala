import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Agraria - Vineyard Management",
	description: "Manage your vineyard treatments and parcels",
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	themeColor: "#16a34a",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="pippola">
			<body className={inter.className}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
