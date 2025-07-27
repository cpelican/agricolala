import { StrictMode, Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { HomeContent } from "@/components/home-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { Grape } from "lucide-react";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";
import { getParcels } from "@/lib/data-fetcher";
import { HomeSkeleton } from "@/components/skeletons/home-skeleton";

export default async function Home({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);
	const session = await requireAuth();

	return (
		<StrictMode>
			<AuthGuard>
				<CachedDataWrapper>
					<LayoutWithHeader
						title="Agricolala"
						subtitle={`${dict?.home?.welcome}, ${session?.user?.name ?? session?.user?.email}`}
						icon={<Grape className="w-8 h-8" />}
					>
						<Suspense fallback={<HomeSkeleton />}>
							<HomeContent
								parcelsPromise={getParcels(session.user.id)}
								locale={lang}
							/>
						</Suspense>
					</LayoutWithHeader>
				</CachedDataWrapper>
			</AuthGuard>
		</StrictMode>
	);
}
