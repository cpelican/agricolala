import type { Metadata } from "next";
import type React from "react";
import "../globals.css";
import { Providers } from "../providers";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Grape } from "lucide-react";
import { CachedDataWrapper } from "@/components/misc/cached-data-wrapper";

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
	return (
		<Providers>
			<AuthGuard>
				<CachedDataWrapper>
					<LayoutWithHeader
						title="Agricolala"
						icon={<Grape className="w-8 h-8" />}
					>
						{children}
					</LayoutWithHeader>
				</CachedDataWrapper>
			</AuthGuard>
		</Providers>
	);
}
