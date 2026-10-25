import type React from "react";
import { Suspense } from "react";
import Image from "next/image";
import { Providers } from "@/app/providers";
import { AccessPending } from "@/components/auth/access-pending";
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
