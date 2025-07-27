import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { TreatmentsContentAsync } from "@/components/treatments-content-async";
import { AddTreatmentButtonAsync } from "@/components/add-treatment-button-async";
import { TreatmentsSkeleton } from "@/components/skeletons/treatments-skeleton";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { getParcels, getTreatments } from "@/lib/data-fetcher";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { ExcelExportDialog } from "@/components/excel-export-dialog";
import { Calendar } from "lucide-react";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";

export default async function TreatmentsPage({
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
					title={dict.treatments.title}
					subtitle={
						dict.treatments.description || "Manage all your wineyard treatments"
					}
					icon={<Calendar />}
				>
					<ExcelExportDialog className="absolute top-6 right-8" />
					<Suspense fallback={<TreatmentsSkeleton />}>
						<TreatmentsContentAsync
							treatmentsPromise={getTreatments(session.user.id)}
						/>
					</Suspense>
					<Suspense fallback={null}>
						<AddTreatmentButtonAsync
							parcelsPromise={getParcels(session.user.id)}
						/>
					</Suspense>
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
