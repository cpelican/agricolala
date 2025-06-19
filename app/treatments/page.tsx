import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { TreatmentsContent } from "@/components/treatments-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { getTreatments } from "@/lib/parcel-helpers";

export default async function TreatmentsPage() {
	const session = await requireAuth();

	const treatments = await getTreatments(session.user.id);
	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Treatments"
				subtitle="Manage all your vineyard treatments"
			>
				<TreatmentsContent treatments={treatments} />
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
