import type { Metadata } from "next";
import type React from "react";
import "../globals.css";
import { Providers } from "../providers";

export const metadata: Metadata = {
	title: "Agricolala - Wineyard Management",
	description: "Manage your wineyard treatments and parcels",
	manifest: "/manifest.json",
};

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <Providers>{children}</Providers>;
}
