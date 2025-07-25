import { AuthGuard } from "@/components/auth-guard";
import { TreatmentsContent } from "@/components/treatments-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { getParcels, getTreatments } from "@/lib/data-fetcher";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { AddTreatmentButton } from "@/components/add-treatment-button";
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
	const dict = await tServer(lang);
	const session = await requireAuth();

	const treatments = await getTreatments(session.user.id);
	const parcels = await getParcels(session.user.id);

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
					<TreatmentsContent treatments={treatments} />
					<AddTreatmentButton parcels={parcels} />
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
