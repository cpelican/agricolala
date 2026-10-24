import type React from "react";
import { Suspense } from "react";
import Image from "next/image";
import { Providers } from "@/app/providers";
import { AccessPending, accountCodeOf } from "@/components/auth/access-pending";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { CachedDataWrapper } from "@/components/misc/cached-data-wrapper";
import { LayoutMainSkeleton } from "@/components/skeletons/layout-main-skeleton";
import { requireAuth } from "@/lib/auth-utils";
import { getLanguageAsLocale } from "@/lib/translations-helpers";

export default async function Layout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const session = await requireAuth();

	// New accounts are opened by hand: until then, explain why and how to ask.
	if (!session.user.isAuthorized) {
		return (
			<AccessPending
				locale={getLanguageAsLocale(lang)}
				email={session.user.email}
				accountCode={accountCodeOf(session.user.id)}
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
						alt="Agricolala"
						width={32}
						height={32}
						className="size-8 shrink-0"
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
