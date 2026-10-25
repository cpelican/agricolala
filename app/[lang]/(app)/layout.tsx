import type React from "react";
import { Suspense } from "react";
import Image from "next/image";
import { Providers } from "@/app/providers";
import { AccessPending } from "@/components/auth/access-pending";
import { LayoutWithHeader } from "@/components/layout/layout-with-header";
import { CachedDataWrapper } from "@/components/layout/cached-data-wrapper";
import { LayoutMainSkeleton } from "@/components/layout/layout-main-skeleton";
import { requireAuth } from "@/lib/auth-utils";
import { getLanguageAsLocale } from "@/lib/i18n/locale";

export default async function Layout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const session = await requireAuth();

	// New accounts are opened by hand: until then, explain why and let them introduce themselves.
	if (!session.user.isAuthorized) {
		return (
			<AccessPending
				locale={getLanguageAsLocale(lang)}
				userId={session.user.id}
				email={session.user.email ?? ""}
			/>
		);
	}

	return (
		<Providers>
			<LayoutWithHeader
				title="Agricolala"
				icon={
					<Image
						src="/1.png"
						alt=""
						width={40}
						height={43}
						className="size-7 shrink-0 object-contain"
						priority
					/>
				}
			>
				<Suspense fallback={<LayoutMainSkeleton />}>
					<CachedDataWrapper>{children}</CachedDataWrapper>
				</Suspense>
			</LayoutWithHeader>
		</Providers>
	);
}
