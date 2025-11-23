import type { Metadata } from "next";
import type React from "react";
import Image from "next/image";
import { Providers } from "../providers";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { CachedDataWrapper } from "@/components/misc/cached-data-wrapper";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Agricolala - Wineyard Management",
	description: "Manage your wineyard treatments and parcels",
};

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await requireAuth();

	return (
		<Providers userEmail={session.user.email}>
			<CachedDataWrapper>
				<LayoutWithHeader
					title="Agricolala"
					icon={<Image src="/1.png" alt="Agricolala" width={32} height={32} />}
					isAuthorized={session.user.isAuthorized}
				>
					{children}
				</LayoutWithHeader>
			</CachedDataWrapper>
		</Providers>
	);
}
