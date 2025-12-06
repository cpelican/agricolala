import type React from "react";
import Image from "next/image";
import { Providers } from "../providers";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { CachedDataWrapper } from "@/components/misc/cached-data-wrapper";
import { requireAuth } from "@/lib/auth-utils";
import { appLanguages } from "@/lib/translations-helpers";

export function generateStaticParams() {
	return Object.values(appLanguages).map((lang) => ({ lang }));
}

export default async function Layout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ lang: string }>;
}) {
	await params;
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
