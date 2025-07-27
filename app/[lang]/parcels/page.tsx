import { AuthGuard } from "@/components/auth-guard";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { Map } from "lucide-react";
import { getParcels } from "@/lib/data-fetcher";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";
import { ParcelsContentAsync } from "@/components/async/parcels-content-async";
import { Suspense } from "react";
import { ParcelsSkeleton } from "@/components/skeletons/parcels-skeleton";

export default async function ParcelsPage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);
	const session = await requireAuth();

	return (
		<AuthGuard>
			<CachedDataWrapper>
				<LayoutWithHeader
					title={dict.parcels.title}
					subtitle={dict.parcels.description}
					icon={<Map />}
				>
					<Suspense fallback={<ParcelsSkeleton />}>
						<ParcelsContentAsync parcelsPromise={getParcels(session.user.id)} />
					</Suspense>
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
