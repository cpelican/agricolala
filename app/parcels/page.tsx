import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ParcelsContent } from "@/components/parcels-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { Map } from "lucide-react";
import { getParcels } from "@/lib/data-fetcher";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";

export default async function ParcelsPage() {
	const session = await requireAuth();
	const parcels = await getParcels(session.user.id);
	return (
		<AuthGuard>
			<CachedDataWrapper>
				<LayoutWithHeader
					title="My Parcels"
					subtitle="Manage your wineyard parcels"
					icon={<Map />}
				>
					<ParcelsContent parcels={parcels} />
					<BottomNavigation />
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
