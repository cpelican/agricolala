import { StrictMode, Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CachedDataWrapper } from "@/components/misc/cached-data-wrapper";
import { HomeContentAsync } from "@/components/async/home-content-async";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
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
							<HomeContentAsync
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
