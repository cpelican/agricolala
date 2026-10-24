import type React from "react";
import { Suspense } from "react";
import Image from "next/image";
import { Providers } from "@/app/providers";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { CachedDataWrapper } from "@/components/misc/cached-data-wrapper";
import { LayoutMainSkeleton } from "@/components/skeletons/layout-main-skeleton";
import { requireAuth } from "@/lib/auth-utils";

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
				isAuthorized={session.user.isAuthorized}
			>
				<Suspense fallback={<LayoutMainSkeleton />}>
					<CachedDataWrapper>{children}</CachedDataWrapper>
				</Suspense>
			</LayoutWithHeader>
		</Providers>
	);
}
