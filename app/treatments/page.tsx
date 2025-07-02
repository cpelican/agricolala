import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { TreatmentsContent } from "@/components/treatments-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { getParcels, getTreatments } from "@/lib/data-fetcher";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { AddTreatmentButton } from "@/components/add-treatment-button";
import { Calendar } from "lucide-react";

export default async function TreatmentsPage() {
	const session = await requireAuth();

	const treatments = await getTreatments(session.user.id);
	const parcels = await getParcels(session.user.id);
	return (
		<AuthGuard>
			<CachedDataWrapper>
				<LayoutWithHeader
					title="Treatments"
					subtitle="Manage all your wineyard treatments"
					icon={<Calendar />}
				>
					<TreatmentsContent treatments={treatments} />
					<AddTreatmentButton parcels={parcels} />
					<BottomNavigation />
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
