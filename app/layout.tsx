import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";
import { Providers } from "./providers";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Agricolala - Vineyard Management",
	description: "Manage your vineyard treatments and parcels",
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
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
				<CachedDataWrapper>
					<Providers>{children}</Providers>
				</CachedDataWrapper>
			</body>
		</html>
	);
}
